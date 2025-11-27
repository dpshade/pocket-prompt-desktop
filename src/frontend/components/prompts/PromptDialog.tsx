import { Copy, Edit, Archive, History, Check, Lock, Share2, Link, Loader2, X } from 'lucide-react';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/frontend/components/ui/dialog';
import { Button } from '@/frontend/components/ui/button';
import { Badge } from '@/frontend/components/ui/badge';
import type { Prompt } from '@/shared/types/prompt';
import { useState, useEffect } from 'react';
import * as tursoQueries from '@/backend/api/turso-queries';

interface PromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: Prompt | null;
  onEdit: () => void;
  onArchive: () => void;
  onShowVersions: () => void;
}

export function PromptDialog({
  open,
  onOpenChange,
  prompt,
  onEdit,
  onArchive,
  onShowVersions,
}: PromptDialogProps) {
  const [copied, setCopied] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);

  // Fetch share token when dialog opens
  useEffect(() => {
    if (open && prompt) {
      tursoQueries.getShareToken(prompt.id).then(setShareToken);
    }
  }, [open, prompt]);

  // Reset share state when dialog closes
  useEffect(() => {
    if (!open) {
      setShareToken(null);
      setShareLinkCopied(false);
    }
  }, [open]);

  const handleShare = async () => {
    if (!prompt) return;

    setIsSharing(true);
    try {
      const token = await tursoQueries.generateShareToken(prompt.id);
      setShareToken(token);
      // Copy the share link to clipboard
      const shareUrl = `${window.location.origin}?share=${token}`;
      await navigator.clipboard.writeText(shareUrl);
      setShareLinkCopied(true);
      setTimeout(() => setShareLinkCopied(false), 2000);
    } catch (error) {
      console.error('Failed to generate share link:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!shareToken) return;
    const shareUrl = `${window.location.origin}?share=${shareToken}`;
    await navigator.clipboard.writeText(shareUrl);
    setShareLinkCopied(true);
    setTimeout(() => setShareLinkCopied(false), 2000);
  };

  const handleUnshare = async () => {
    if (!prompt) return;

    try {
      await tursoQueries.removeShareToken(prompt.id);
      setShareToken(null);
    } catch (error) {
      console.error('Failed to remove share link:', error);
    }
  };

  // Check if prompt has version history based on the latest version number
  const hasVersionHistory = (prompt: Prompt | null) => {
    if (!prompt || !prompt.versions || prompt.versions.length === 0) return false;
    const latestVersion = prompt.versions[prompt.versions.length - 1];
    return latestVersion && latestVersion.version > 1;
  };

  // Keyboard shortcuts for the dialog
  useEffect(() => {
    if (!open || !prompt) return;

    const handleCopy = () => {
      navigator.clipboard.writeText(prompt.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // Don't handle shortcuts when typing
      if (isTyping) return;

      switch (event.key) {
        case 'e':
          event.preventDefault();
          onEdit();
          break;
        case 'c':
          event.preventDefault();
          handleCopy();
          break;
        case 'a':
          if (!prompt.isArchived) {
            event.preventDefault();
            onArchive();
            onOpenChange(false);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, prompt, onEdit, onArchive, onOpenChange]);

  if (!prompt) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const characterCount = typeof prompt.content === 'string' ? prompt.content.length : 0;
  const wordCount = typeof prompt.content === 'string'
    ? prompt.content.trim().split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="flex max-h-[88vh] flex-col">
        <DialogHeader className="space-y-4 text-left border-b border-primary/20">
          <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <DialogTitle className="text-3xl sm:text-4xl font-semibold tracking-tight">
                  {prompt.title}
                </DialogTitle>
                {prompt.description && (
                  <DialogDescription className="text-base text-foreground/70 max-w-2xl">
                    {prompt.description}
                  </DialogDescription>
                )}
              </div>

            <div className="flex flex-wrap items-center gap-2">
                {hasVersionHistory(prompt) && (
                  <Badge variant="outline" className="px-3 py-1 text-xs">
                    v{prompt.versions[prompt.versions.length - 1]?.version}
                  </Badge>
                )}
                {prompt.isArchived && (
                  <Badge variant="outline" className="px-3 py-1 text-xs bg-amber-500/15 text-amber-700 dark:text-amber-300">
                    Archived
                  </Badge>
                )}
              </div>
          </div>

          <div className="flex flex-col gap-2 text-xs text-foreground/60">
            <div className="flex flex-col gap-1">
              <div>Created: <span className="font-medium text-foreground/80">{formatDate(prompt.createdAt)}</span></div>
              <div>Last updated: <span className="font-medium text-foreground/80">{formatDate(prompt.updatedAt)}</span></div>
            </div>
            {prompt.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {prompt.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs px-3 py-1">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </DialogHeader>

        <DialogBody className="flex-1 min-h-0 flex flex-col">
          <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-foreground/50 flex-shrink-0">
            <span>{wordCount} words</span>
            <span>•</span>
            <span>{characterCount} characters</span>
          </div>
          <div className="border border-primary/20 bg-primary/[0.02] rounded-xl p-5 flex-1 min-h-0 flex flex-col">
            <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed pr-1 overflow-y-auto flex-1 min-h-0">
              {typeof prompt.content === 'string' ? prompt.content : 'Encrypted content unavailable'}
            </pre>
          </div>
        </DialogBody>

        <DialogFooter className="flex-row justify-between border-t border-primary/20">
          <div className="flex items-center">
            {shareToken ? (
              <Badge
                variant="secondary"
                className="flex items-center gap-1.5 px-3 py-1 text-xs bg-green-500/15 text-green-700 dark:text-green-400"
                title="This prompt has a shareable link"
              >
                <Link className="h-3.5 w-3.5" />
                Shared
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="flex items-center gap-1.5 px-3 py-1 text-xs"
                title="Stored locally on your device — only you can access this prompt"
              >
                <Lock className="h-3.5 w-3.5" />
                Private
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleCopy}
            size="sm"
            className="gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                <span className="hidden sm:inline">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </Button>

          {/* Share button */}
          {shareToken ? (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  onClick={handleCopyShareLink}
                  size="sm"
                  className="gap-2"
                  title="Copy share link"
                >
                  {shareLinkCopied ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span className="hidden sm:inline">Link Copied</span>
                    </>
                  ) : (
                    <>
                      <Link className="h-4 w-4" />
                      <span className="hidden sm:inline">Copy Link</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleUnshare}
                  size="sm"
                  className="px-2 text-muted-foreground hover:text-destructive"
                  title="Remove share link"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={handleShare}
                disabled={isSharing}
                size="sm"
                className="gap-2"
              >
                {isSharing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Sharing...</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Share</span>
                  </>
                )}
              </Button>
          )}

          {hasVersionHistory(prompt) && (
            <Button
              variant="outline"
              onClick={onShowVersions}
              size="sm"
              className="gap-2"
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </Button>
          )}

          <Button
            variant="outline"
            onClick={onEdit}
            size="sm"
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            <span className="hidden sm:inline">Edit</span>
          </Button>

          {!prompt.isArchived && (
            <Button
              variant="outline"
              onClick={() => {
                onArchive();
                onOpenChange(false);
              }}
              size="sm"
              className="gap-2"
            >
              <Archive className="h-4 w-4" />
              <span className="hidden sm:inline">Archive</span>
            </Button>
          )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}