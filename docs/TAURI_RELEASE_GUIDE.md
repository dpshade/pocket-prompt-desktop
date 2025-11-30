# Tauri Release Guide

This guide explains how to build, sign, and distribute Tauri desktop applications across all supported platforms. It's based on the Pocket Prompt release workflow and official Tauri documentation.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Project Configuration](#project-configuration)
- [Platform-Specific Builds](#platform-specific-builds)
  - [macOS](#macos)
  - [Windows](#windows)
  - [Linux](#linux)
  - [Mobile (iOS/Android)](#mobile-iosandroid)
- [Automated CI/CD Release](#automated-cicd-release)
- [Code Signing](#code-signing)
- [Distribution Channels](#distribution-channels)
- [Local Development Installs](#local-development-installs)

---

## Overview

Tauri apps compile to native binaries for each platform:

| Platform | Output Formats |
|----------|----------------|
| macOS | `.app` bundle, `.dmg` installer |
| Windows | `.exe`, `.msi` installer, NSIS installer |
| Linux | `.deb`, `.rpm`, `.AppImage`, Snap, Flatpak |
| iOS | `.ipa` (App Store) |
| Android | `.apk`, `.aab` (Google Play) |

The build process:
1. Compiles your frontend (React/Vue/etc.) into static assets
2. Compiles the Rust backend
3. Bundles everything into platform-specific installers

---

## Prerequisites

### All Platforms

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Tauri CLI
cargo install tauri-cli

# Or via npm/bun
bun add -D @tauri-apps/cli
```

### macOS

- Xcode Command Line Tools: `xcode-select --install`
- For iOS: Full Xcode from App Store

### Windows

- [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- WebView2 (included in Windows 11, auto-installed on Windows 10)

### Linux

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  patchelf \
  xdg-utils

# Fedora
sudo dnf install webkit2gtk4.1-devel \
  openssl-devel \
  curl \
  wget \
  file \
  libappindicator-gtk3-devel \
  librsvg2-devel

# Arch
sudo pacman -S webkit2gtk-4.1 \
  base-devel \
  curl \
  wget \
  file \
  openssl \
  appmenu-gtk-module \
  libappindicator-gtk3 \
  librsvg
```

---

## Project Configuration

### `tauri.conf.json` Bundle Settings

The bundle configuration in `src-tauri/tauri.conf.json` controls what gets built:

```json
{
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "identifier": "com.yourcompany.yourapp",
    "category": "Utility",
    "shortDescription": "Your app description",
    "longDescription": "A longer description of your application.",
    "macOS": {
      "minimumSystemVersion": "10.15"
    }
  }
}
```

### Required Icons

Place these in `src-tauri/icons/`:

| File | Platform | Size |
|------|----------|------|
| `icon.icns` | macOS | Multi-resolution |
| `icon.ico` | Windows | Multi-resolution |
| `32x32.png` | All | 32×32 |
| `128x128.png` | All | 128×128 |
| `128x128@2x.png` | macOS Retina | 256×256 |
| `icon.png` | Linux | 512×512+ |
| `Square*.png` | Windows Store | Various |
| `ios/AppIcon-*.png` | iOS | Various |
| `android/mipmap-*/` | Android | Various |

Generate all icons from a single source:

```bash
# Using Tauri CLI
bunx tauri icon /path/to/source-icon.png
```

---

## Platform-Specific Builds

### macOS

#### Build Commands

```bash
# Debug build
bunx tauri build --debug

# Release build (unsigned)
bunx tauri build

# Target specific architecture
bunx tauri build --target aarch64-apple-darwin  # Apple Silicon
bunx tauri build --target x86_64-apple-darwin   # Intel

# Universal binary (both architectures)
bunx tauri build --target universal-apple-darwin
```

#### Output Locations

```
src-tauri/target/release/bundle/
├── macos/
│   └── Your App.app
└── dmg/
    └── Your App_x.x.x_aarch64.dmg
```

#### Quick Install for Development

```bash
# Copy to Applications and register URL schemes
cp -R 'src-tauri/target/release/bundle/macos/Your App.app' '/Applications/'

# Register with Launch Services (for URL schemes)
/System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/LaunchServices.framework/Versions/A/Support/lsregister -f '/Applications/Your App.app'
```

### Windows

#### Build Commands

```bash
# Standard build
bunx tauri build

# Specific installer type
bunx tauri build --bundles msi
bunx tauri build --bundles nsis
```

#### Output Locations

```
src-tauri/target/release/bundle/
├── msi/
│   └── Your App_x.x.x_x64_en-US.msi
└── nsis/
    └── Your App_x.x.x_x64-setup.exe
```

### Linux

#### Build Commands

```bash
# All formats
bunx tauri build

# Specific formats
bunx tauri build --bundles deb
bunx tauri build --bundles rpm
bunx tauri build --bundles appimage
```

#### Output Locations

```
src-tauri/target/release/bundle/
├── deb/
│   └── your-app_x.x.x_amd64.deb
├── rpm/
│   └── your-app-x.x.x-1.x86_64.rpm
└── appimage/
    └── your-app_x.x.x_amd64.AppImage
```

#### Local User Install (No Root)

For development/testing without system-wide installation:

```bash
# Build the release binary
bunx tauri build

# Create local directories
mkdir -p ~/.local/bin ~/.local/share/icons ~/.local/share/applications

# Copy binary
cp src-tauri/target/release/your-app ~/.local/bin/

# Copy icon
cp src-tauri/icons/128x128.png ~/.local/share/icons/your-app.png

# Create desktop entry
cat > ~/.local/share/applications/your-app.desktop << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Your App
Comment=Your app description
Exec=\$HOME/.local/bin/your-app %u
Icon=\$HOME/.local/share/icons/your-app.png
Terminal=false
Categories=Utility;
StartupWMClass=your-app
MimeType=x-scheme-handler/yourscheme;
Keywords=your;keywords;
EOF

# Update desktop database
update-desktop-database ~/.local/share/applications 2>/dev/null || true
```

### Mobile (iOS/Android)

#### iOS

```bash
# Initialize iOS project (first time only)
bunx tauri ios init

# Development build
bunx tauri ios dev

# Release build
bunx tauri ios build
```

#### Android

```bash
# Initialize Android project (first time only)
bunx tauri android init

# Development build
bunx tauri android dev

# Release build (APK)
bunx tauri android build

# Release build (AAB for Google Play)
bunx tauri android build --aab
```

---

## Automated CI/CD Release

### GitHub Actions Workflow

Create `.github/workflows/release.yml`:

```yaml
name: 'Release Desktop App'

on:
  workflow_dispatch:
  push:
    tags:
      - 'v*'

jobs:
  release-tauri:
    permissions:
      contents: write
    strategy:
      fail-fast: false
      matrix:
        include:
          - name: 'macOS (Apple Silicon)'
            runner: 'macos-latest'
            args: '--target aarch64-apple-darwin'
          - name: 'macOS (Intel)'
            runner: 'macos-latest'
            args: '--target x86_64-apple-darwin'
          - name: 'Linux (x64)'
            runner: 'ubuntu-22.04'
            args: ''
          - name: 'Linux (ARM64)'
            runner: 'ubuntu-22.04-arm'
            args: ''
          - name: 'Windows (x64)'
            runner: 'windows-latest'
            args: ''

    name: ${{ matrix.name }}
    runs-on: ${{ matrix.runner }}
    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies (Linux only)
        if: startsWith(matrix.runner, 'ubuntu')
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf xdg-utils

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2

      - name: Install Rust stable
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.runner == 'macos-latest' && 'aarch64-apple-darwin,x86_64-apple-darwin' || '' }}

      - name: Rust cache
        uses: swatinem/rust-cache@v2
        with:
          workspaces: './src-tauri -> target'

      - name: Install frontend dependencies
        run: bun install

      - name: Build and release
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: v__VERSION__
          releaseName: 'App Name v__VERSION__'
          releaseBody: 'See the assets to download and install.'
          releaseDraft: true
          prerelease: true
          args: ${{ matrix.args }}
```

### Release Script

Create a `release.sh` helper:

```bash
#!/bin/bash
set -e

# Get current version from tauri.conf.json
CURRENT_VERSION=$(grep '"version":' src-tauri/tauri.conf.json | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')
echo "Current version: ${CURRENT_VERSION}"

# Determine new version (auto-bump patch if not provided)
if [ -z "$1" ]; then
  IFS='.' read -r -a version_parts <<< "$CURRENT_VERSION"
  NEW_VERSION="${version_parts[0]}.${version_parts[1]}.$((version_parts[2] + 1))"
else
  NEW_VERSION="$1"
fi

echo "New version: ${NEW_VERSION}"
read -p "Create release v${NEW_VERSION}? (y/n) " -n 1 -r
echo
[[ ! $REPLY =~ ^[Yy]$ ]] && exit 1

# Update version in tauri.conf.json
sed -i.bak "s/\"version\": \"${CURRENT_VERSION}\"/\"version\": \"${NEW_VERSION}\"/" src-tauri/tauri.conf.json
rm src-tauri/tauri.conf.json.bak

# Commit and tag
git add src-tauri/tauri.conf.json
git commit -m "Bump version to ${NEW_VERSION}"
git push
git tag "v${NEW_VERSION}"
git push origin "v${NEW_VERSION}"

echo "✓ Release v${NEW_VERSION} initiated!"
echo "GitHub Actions will build binaries for all platforms."
```

---

## Code Signing

### macOS Code Signing & Notarization

Required for distribution outside the App Store:

1. **Get certificates** from Apple Developer Program ($99/year)
2. **Add secrets** to GitHub Actions:
   - `APPLE_CERTIFICATE`: Base64-encoded .p12 certificate
   - `APPLE_CERTIFICATE_PASSWORD`: Certificate password
   - `APPLE_SIGNING_IDENTITY`: e.g., "Developer ID Application: Your Name (TEAMID)"
   - `APPLE_ID`: Your Apple ID email
   - `APPLE_PASSWORD`: App-specific password
   - `APPLE_TEAM_ID`: Your team ID

3. **Update workflow**:

```yaml
- name: Build and release
  uses: tauri-apps/tauri-action@v0
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
    APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
    APPLE_SIGNING_IDENTITY: ${{ secrets.APPLE_SIGNING_IDENTITY }}
    APPLE_ID: ${{ secrets.APPLE_ID }}
    APPLE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
    APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
```

### Windows Code Signing

Options:
- **EV Certificate** (hardware token): Most trusted, expensive
- **OV Certificate**: Standard signing
- **Azure Trusted Signing**: Cloud-based, no hardware

Add to workflow:

```yaml
env:
  TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
  TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
```

### Linux Signing

Linux packages are typically signed with GPG:

```bash
# Generate GPG key
gpg --full-generate-key

# Sign .deb
dpkg-sig --sign builder your-app_x.x.x_amd64.deb

# Sign .rpm
rpm --addsign your-app-x.x.x-1.x86_64.rpm
```

---

## Distribution Channels

### Direct Download (GitHub Releases)

The default approach—users download from your GitHub releases page.

### macOS App Store

1. Configure in `tauri.conf.json`:
   ```json
   {
     "bundle": {
       "macOS": {
         "entitlements": "./Entitlements.plist",
         "providerShortName": "TEAMID"
       }
     }
   }
   ```
2. Build with `bunx tauri build`
3. Upload via Transporter or `xcrun altool`

### Microsoft Store

1. Add Windows Store icons (`Square*.png`, `StoreLogo.png`)
2. Build MSIX package
3. Submit via Partner Center

### Linux Package Managers

| Channel | Format | Notes |
|---------|--------|-------|
| **Debian/Ubuntu** | `.deb` | Can host in PPA |
| **Fedora/RHEL** | `.rpm` | Can host in COPR |
| **AUR** | PKGBUILD | Arch User Repository |
| **Snap Store** | `.snap` | `snapcraft.yaml` required |
| **Flathub** | Flatpak | `flatpak-builder` manifest |
| **AppImage** | `.AppImage` | Self-contained, no install |

### Mobile Stores

| Store | Format | Notes |
|-------|--------|-------|
| **Apple App Store** | `.ipa` | Requires Apple Developer Program |
| **Google Play** | `.aab` | Requires Google Play Console |
| **F-Droid** | `.apk` | Open source apps only |

---

## Local Development Installs

### macOS Quick Install

```bash
# From package.json script
bun run tauri:install-macos
```

This:
1. Builds the app
2. Copies to `/Applications`
3. Registers URL schemes with Launch Services

### Linux Local Install

```bash
# From package.json script
bun run install-local
```

This:
1. Builds the release binary
2. Copies to `~/.local/bin/`
3. Installs icon to `~/.local/share/icons/`
4. Creates `.desktop` entry in `~/.local/share/applications/`
5. Updates desktop database

### Windows Development

```powershell
# Build and run installer
bunx tauri build --bundles nsis
# Run the generated installer from target/release/bundle/nsis/
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Missing WebKit (Linux) | Install `libwebkit2gtk-4.1-dev` |
| macOS "damaged app" | Run `xattr -cr /path/to/App.app` |
| Windows SmartScreen | Sign your app or users must click "More info" → "Run anyway" |
| Linux no icon | Ensure `.desktop` file has correct `Icon=` path |
| ARM64 Linux build fails | Use `ubuntu-22.04-arm` runner or cross-compile |

### Debug Builds

```bash
# Verbose output
RUST_BACKTRACE=1 bunx tauri build --debug

# Check what's being bundled
bunx tauri build --verbose
```

---

## References

- [Tauri Distribution Overview](https://v2.tauri.app/distribute/)
- [macOS Signing](https://v2.tauri.app/distribute/sign/macos/)
- [Windows Signing](https://v2.tauri.app/distribute/sign/windows/)
- [GitHub Actions Pipeline](https://v2.tauri.app/distribute/pipelines/github/)
- [tauri-action](https://github.com/tauri-apps/tauri-action)

