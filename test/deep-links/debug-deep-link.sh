#!/bin/bash

echo "=== Deep Link Debugging Script ==="
echo

# 1. Check if protocol is registered
echo "1. Protocol Registration:"
xdg-mime query default x-scheme-handler/promptvault
echo

# 2. Check desktop files
echo "2. Desktop Files:"
ls -la ~/.local/share/applications/ | grep prompt
echo

# 3. Test protocol URL parsing directly
echo "3. Testing URL parsing:"
echo "Testing: promptvault://search?q=test&expr=tag:example"
echo

# 4. Try to open protocol URL
echo "4. Opening protocol URL:"
xdg-open "promptvault://search?q=test&expr=tag:example" &
sleep 2
echo

# 5. Check if any prompt-vault processes are running
echo "5. Running processes:"
ps aux | grep prompt-vault | grep -v grep || echo "No prompt-vault processes found"
echo

# 6. Check for any Tauri apps
echo "6. Tauri processes:"
ps aux | grep -i tauri | grep -v grep || echo "No Tauri processes found"
echo

echo "=== Debugging Complete ==="