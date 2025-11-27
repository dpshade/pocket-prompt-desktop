/**
 * VersionHistory - Display prompt version history with Turso backend
 *
 * Loads version content from local Turso database for diff viewing.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/frontend/components/ui/dialog';
import { Button } from '@/frontend/components/ui/button';
import { Badge } from '@/frontend/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/frontend/components/ui/tooltip';
import type { Prompt, PromptVersion } from '@/shared/types/prompt';
import { useState, useRef, useCallback } from 'react';
import { getVersionContent } from '@/backend/api/turso-queries';
import { Eye } from 'lucide-react';

interface VersionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: Prompt | null;
  onRestoreVersion: (version: PromptVersion) => void;
  password?: string;
}

interface VersionData {
  content: string;
  previousContent?: string;
}

export function VersionHistory({
  open,
  onOpenChange,
  prompt,
  onRestoreVersion,
}: VersionHistoryProps) {
  const [selectedVersionTxId, setSelectedVersionTxId] = useState<string | null>(null);
  const [selectedVersionData, setSelectedVersionData] = useState<VersionData | null>(null);
  const [loading, setLoading] = useState(false);

  // Cache for fetched version content
  const contentCacheRef = useRef<Map<string, string>>(new Map());

  // Deduplicate versions - keep only the latest transaction for each version number
  // Must compute before useCallback to maintain stable hook order
  const uniqueVersions = prompt?.versions.reduce((acc: PromptVersion[], curr: PromptVersion) => {
    const existingIndex = acc.findIndex(v => v.version === curr.version);
    if (existingIndex === -1) {
      acc.push(curr);
    } else {
      if (curr.timestamp > acc[existingIndex].timestamp) {
        acc[existingIndex] = curr;
      }
    }
    return acc;
  }, []) ?? [];

  // Sort by version number ascending (oldest first)
  uniqueVersions.sort((a, b) => a.version - b.version);

  const handleViewVersion = useCallback(async (version: PromptVersion, index: number) => {
    if (!prompt) return;

    // Toggle off if clicking the same version
    if (selectedVersionTxId === version.txId) {
      setSelectedVersionTxId(null);
      setSelectedVersionData(null);
      return;
    }

    setLoading(true);
    try {
      const cache = contentCacheRef.current;

      // Helper to get content from cache or fetch
      const getContent = async (txId: string): Promise<string | null> => {
        if (cache.has(txId)) {
          return cache.get(txId)!;
        }

        // For current version, use prompt content
        if (txId === prompt.currentTxId || txId === prompt.id) {
          cache.set(txId, prompt.content);
          return prompt.content;
        }

        // Fetch from Turso
        const content = await getVersionContent(txId);
        if (content) {
          cache.set(txId, content);
        }
        return content;
      };

      // Fetch current version content
      const content = await getContent(version.txId);

      if (!content) {
        setSelectedVersionTxId(version.txId);
        setSelectedVersionData(null);
        return;
      }

      // Fetch previous version content for comparison
      let previousContent: string | undefined;
      if (index > 0) {
        const prevVersion = uniqueVersions[index - 1];
        previousContent = (await getContent(prevVersion.txId)) || undefined;
      }

      setSelectedVersionTxId(version.txId);
      setSelectedVersionData({ content, previousContent });
    } catch (error) {
      console.error('Failed to load version:', error);
      setSelectedVersionTxId(version.txId);
      setSelectedVersionData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedVersionTxId, prompt, uniqueVersions]);

  if (!prompt) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Version History: {prompt.title}</DialogTitle>
          <DialogDescription>
            View and restore previous versions of this prompt
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {uniqueVersions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No version history available
            </div>
          ) : (
            uniqueVersions.map((version, index) => {
              const isLatest = index === uniqueVersions.length - 1;
              return (
                <div
                  key={version.txId}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Version {version.version}</span>
                        {isLatest && (
                          <Badge variant="default">Current</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(version.timestamp)}
                      </div>
                      {version.changeNote && (
                        <div className="text-sm italic text-muted-foreground">
                          "{version.changeNote}"
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewVersion(version, index)}
                              disabled={loading}
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              {selectedVersionTxId === version.txId ? 'Hide' : 'View'}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View version content</p>
                          </TooltipContent>
                        </Tooltip>

                        {!isLatest && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => {
                                  onRestoreVersion(version);
                                  onOpenChange(false);
                                }}
                              >
                                Restore
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Restore this version</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </TooltipProvider>
                    </div>
                  </div>

                  {/* Show version content if selected */}
                  {selectedVersionTxId === version.txId && selectedVersionData && (
                    <div className="mt-3 space-y-3">
                      {/* Content diff or display */}
                      {selectedVersionData.previousContent ? (
                        <div className="space-y-2">
                          <div className="text-xs font-semibold text-muted-foreground">
                            Changes from previous version:
                          </div>
                          {selectedVersionData.content === selectedVersionData.previousContent ? (
                            <div className="rounded-md border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-700 dark:text-blue-300">
                              No content changes (metadata only update)
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">Previous:</div>
                                <div className="rounded-md border bg-red-500/5 p-2 max-h-48 overflow-y-auto">
                                  <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground">
                                    {selectedVersionData.previousContent}
                                  </pre>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">This version:</div>
                                <div className="rounded-md border bg-green-500/5 p-2 max-h-48 overflow-y-auto">
                                  <pre className="whitespace-pre-wrap font-mono text-xs">
                                    {selectedVersionData.content}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-xs font-semibold text-muted-foreground">
                            Initial content:
                          </div>
                          <div className="rounded-md border bg-muted/50 p-3 max-h-60 overflow-y-auto">
                            <pre className="whitespace-pre-wrap font-mono text-xs">
                              {selectedVersionData.content}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedVersionTxId === version.txId && !selectedVersionData && !loading && (
                    <div className="mt-3 rounded-md border border-red-600/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
                      Failed to load version content
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
