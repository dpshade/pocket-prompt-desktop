import matter from 'gray-matter';

/**
 * Simple hash function for generating stable IDs from content
 */
function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Extract the first markdown heading from content
 */
function extractFirstHeading(content: string): string | null {
  const match = content.match(/^#+\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

export interface ImportedPrompt {
  id: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
  createdAt?: number;
  updatedAt?: number;
  isArchived?: boolean;
}

export interface ImportResult {
  success: boolean;
  prompt?: ImportedPrompt;
  error?: string;
}

export interface FileImportResult {
  fileName: string;
  success: boolean;
  prompt?: ImportedPrompt;
  error?: string;
}

export interface BatchImportResult {
  total: number;
  successful: number;
  failed: number;
  results: FileImportResult[];
}

/**
 * Extract filename without extension from a path
 */
function getFileNameWithoutExtension(filePath: string): string {
  const segments = filePath.split('/');
  const filename = segments[segments.length - 1] || 'Untitled';
  return filename.replace(/\.md$/i, '');
}

/**
 * Parse a markdown file with frontmatter and extract prompt data.
 * Accepts any valid markdown with frontmatter — missing fields get defaults.
 * @param fileContent - The raw markdown file content
 * @param filePath - Optional file path, used to derive title/id when not in frontmatter
 */
export function parseMarkdownPrompt(fileContent: string, filePath?: string): ImportResult {
  try {
    // Parse the markdown with frontmatter
    const { data, content } = matter(fileContent);

    // Must have frontmatter or content to be useful
    const hasFrontmatter = Object.keys(data).length > 0;
    const hasContent = content.trim().length > 0;
    
    if (!hasFrontmatter && !hasContent) {
      return {
        success: false,
        error: 'Empty file: no frontmatter and no content',
      };
    }

    // Generate stable ID from frontmatter or derive from content hash
    // Priority: explicit id > name > title > content-based hash
    const id = data.id 
      ? String(data.id)
      : data.name 
        ? `name:${String(data.name)}`
        : data.title
          ? `title:${String(data.title).toLowerCase().replace(/\s+/g, '-').slice(0, 50)}`
          : `content:${hashContent(content)}`;

    // Title: prefer explicit title, fall back to name, then first heading, then filename
    const title = data.title 
      || data.name 
      || extractFirstHeading(content) 
      || (filePath ? getFileNameWithoutExtension(filePath) : 'Untitled');
    
    const description = data.description || '';
    const tags = Array.isArray(data.tags) ? data.tags : [];

    // Convert timestamps if present
    let createdAt: number | undefined;
    let updatedAt: number | undefined;

    if (data.created_at) {
      const createdDate = new Date(data.created_at);
      if (!isNaN(createdDate.getTime())) {
        createdAt = createdDate.getTime();
      }
    }

    if (data.updated_at) {
      const updatedDate = new Date(data.updated_at);
      if (!isNaN(updatedDate.getTime())) {
        updatedAt = updatedDate.getTime();
      }
    }

    // Check archived status
    const isArchived = data.archived === true;

    return {
      success: true,
      prompt: {
        id,
        title,
        description,
        content: content.trim(),
        tags,
        createdAt,
        updatedAt,
        isArchived,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse markdown file',
    };
  }
}

/**
 * Read and parse a markdown file from a File object
 */
export async function importMarkdownFile(file: File): Promise<ImportResult> {
  try {
    // Validate file type
    if (!file.name.endsWith('.md')) {
      return {
        success: false,
        error: 'Invalid file type. Only .md files are supported.',
      };
    }

    // Read file content
    const fileContent = await file.text();

    // Parse the markdown
    return parseMarkdownPrompt(fileContent);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to read file',
    };
  }
}

/**
 * Import multiple markdown files from a directory
 */
export async function importMarkdownDirectory(files: FileList): Promise<BatchImportResult> {
  const results: FileImportResult[] = [];
  let successful = 0;
  let failed = 0;

  // Filter for .md files only
  const mdFiles = Array.from(files).filter(file => file.name.endsWith('.md'));

  // Process each file
  for (const file of mdFiles) {
    const result = await importMarkdownFile(file);

    const fileResult: FileImportResult = {
      fileName: file.name,
      success: result.success,
      prompt: result.prompt,
      error: result.error,
    };

    results.push(fileResult);

    if (result.success) {
      successful++;
    } else {
      failed++;
    }
  }

  return {
    total: mdFiles.length,
    successful,
    failed,
    results,
  };
}
