'use client'

import { useState } from 'react'
import {
  AlertCircle,
  Loader2,
  Mic,
  MoreVertical,
  Pause,
  Play,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export interface VoiceClone {
  id: string
  name: string
  description: string | null
  provider: string
  status: string
  minimaxVoiceId: string | null
  speakerEmbeddingUrl: string | null
  previewAudioUrl: string | null
  sourceAudioUrl: string
  error: string | null
  createdAt: string | Date
}

interface VoiceCloneCardProps {
  voiceClone: VoiceClone
  onDelete: (id: string) => void
  isDeleting?: boolean
}

function getProviderDisplayName(provider: string): string {
  switch (provider) {
    case 'minimax':
      return 'MiniMax'
    case 'qwen':
      return 'Qwen 3'
    default:
      return provider
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'ready':
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
    case 'processing':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
    case 'failed':
      return 'bg-red-500/10 text-red-600 border-red-500/20'
    default:
      return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
  }
}

function formatDate(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function VoiceCloneCard({
  voiceClone,
  onDelete,
  isDeleting = false,
}: VoiceCloneCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)

  const handlePlayPreview = () => {
    if (!voiceClone.previewAudioUrl) return

    if (isPlaying && audio) {
      audio.pause()
      setIsPlaying(false)
      return
    }

    const newAudio = new Audio(voiceClone.previewAudioUrl)
    newAudio.onended = () => setIsPlaying(false)
    newAudio.play()
    setAudio(newAudio)
    setIsPlaying(true)
  }

  const handleDelete = () => {
    onDelete(voiceClone.id)
    setIsDeleteDialogOpen(false)
  }

  const isReady = voiceClone.status === 'ready'
  const isFailed = voiceClone.status === 'failed'
  const isProcessing = voiceClone.status === 'processing'

  return (
    <>
      <div className="group relative flex flex-col gap-3 p-4 rounded-xl border bg-card hover:shadow-[var(--shadow-md)] transition-all duration-300">
        {/* Header Row */}
        <div className="flex items-start gap-3">
          {/* Voice Icon */}
          <div
            className={cn(
              'relative shrink-0 w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden',
              isReady
                ? 'bg-gradient-to-br from-primary/20 via-primary/10 to-transparent'
                : isFailed
                  ? 'bg-gradient-to-br from-red-500/20 via-red-500/10 to-transparent'
                  : 'bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-transparent',
            )}
          >
            {isProcessing ? (
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
            ) : isFailed ? (
              <AlertCircle className="h-5 w-5 text-red-500" />
            ) : (
              <Mic className="h-5 w-5 text-primary" />
            )}
          </div>

          {/* Voice Info */}
          <div className="flex-1 min-w-0">
            <h3
              className="font-medium text-sm leading-tight truncate"
              title={voiceClone.name}
            >
              {voiceClone.name}
            </h3>
            {voiceClone.description && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {voiceClone.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className="text-[10px]">
                {getProviderDisplayName(voiceClone.provider)}
              </Badge>
              <Badge
                variant="outline"
                className={cn('text-[10px]', getStatusColor(voiceClone.status))}
              >
                {voiceClone.status}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDate(voiceClone.createdAt)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Play Preview Button */}
            {isReady && voiceClone.previewAudioUrl && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handlePlayPreview}
                className="h-8 w-8"
                title="Play preview"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            )}

            {/* More Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-8 w-8"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MoreVertical className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Error Message */}
        {isFailed && voiceClone.error && (
          <div className="text-xs text-red-500 bg-red-500/10 p-2 rounded-lg">
            {voiceClone.error}
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="relative h-1 flex-1 bg-muted rounded-full overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-blue-500/50 rounded-full animate-pulse w-1/3" />
            </div>
            <span>Cloning...</span>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Voice Clone</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{voiceClone.name}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function VoiceCloneCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border bg-card">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-12 h-12 rounded-xl bg-muted animate-pulse" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
          <div className="h-3 bg-muted rounded w-1/3 animate-pulse" />
        </div>
        <div className="h-8 w-8 bg-muted rounded-lg animate-pulse" />
      </div>
    </div>
  )
}
