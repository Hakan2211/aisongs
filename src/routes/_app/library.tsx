import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  Library,
  Music,
  Play,
  Pause,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  MoreVertical,
  Pencil,
  X,
  Check,
  Cloud,
  CloudOff,
  CloudUpload,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AudioPlayer } from '@/components/audio-player'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/library')({
  component: LibraryPage,
})

interface Generation {
  id: string
  provider: string
  prompt: string
  lyrics: string | null
  status: string
  audioUrl: string | null
  audioStored: boolean
  title: string | null
  progress: number
  error: string | null
  createdAt: string
}

function LibraryPage() {
  const queryClient = useQueryClient()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [playerTrack, setPlayerTrack] = useState<Generation | null>(null)

  // Fetch all generations
  const { data, isLoading } = useQuery({
    queryKey: ['all-generations'],
    queryFn: async () => {
      const { listGenerationsFn } = await import('@/server/music.fn')
      const result = await listGenerationsFn({ data: { limit: 100 } })
      return result as { generations: Generation[]; total: number }
    },
  })

  const generations = data?.generations || []
  const total = data?.total || 0

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (generationId: string) => {
      const { deleteGenerationFn } = await import('@/server/music.fn')
      return deleteGenerationFn({ data: { generationId } })
    },
    onSuccess: () => {
      toast.success('Track deleted')
      queryClient.invalidateQueries({ queryKey: ['all-generations'] })
      queryClient.invalidateQueries({ queryKey: ['recent-generations'] })
      setDeleteId(null)
      // Close player if deleted track was playing
      if (playerTrack && playerTrack.id === deleteId) {
        setPlayerTrack(null)
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete track')
    },
  })

  // Rename mutation
  const renameMutation = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { updateGenerationTitleFn } = await import('@/server/music.fn')
      return updateGenerationTitleFn({ data: { generationId: id, title } })
    },
    onSuccess: () => {
      toast.success('Track renamed')
      queryClient.invalidateQueries({ queryKey: ['all-generations'] })
      queryClient.invalidateQueries({ queryKey: ['recent-generations'] })
      setEditingId(null)
      setEditTitle('')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to rename track')
    },
  })

  // Upload to CDN mutation
  const uploadMutation = useMutation({
    mutationFn: async (generationId: string) => {
      const { uploadToCdnFn } = await import('@/server/music.fn')
      return uploadToCdnFn({ data: { generationId } })
    },
    onSuccess: () => {
      toast.success('Track uploaded to cloud storage')
      queryClient.invalidateQueries({ queryKey: ['all-generations'] })
      queryClient.invalidateQueries({ queryKey: ['recent-generations'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload to cloud')
    },
  })

  // Start editing
  const startEditing = (gen: Generation) => {
    setEditingId(gen.id)
    setEditTitle(gen.title || gen.prompt.slice(0, 50))
  }

  // Save edit
  const saveEdit = () => {
    if (!editingId || !editTitle.trim()) return
    renameMutation.mutate({ id: editingId, title: editTitle.trim() })
  }

  // Cancel edit
  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
  }

  // Download audio
  const handleDownload = async (audioUrl: string, title: string) => {
    try {
      const response = await fetch(audioUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title || 'music'}.mp3`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Download started')
    } catch (error) {
      toast.error('Failed to download')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="h-3 w-3" />
            Completed
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <AlertCircle className="h-3 w-3" />
            Failed
          </span>
        )
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processing
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        )
    }
  }

  const getProviderLabel = (provider: string) => {
    switch (provider) {
      case 'elevenlabs':
        return 'ElevenLabs'
      case 'minimax':
        return 'MiniMax'
      default:
        return provider
    }
  }

  const getCloudStatus = (gen: Generation) => {
    if (gen.status !== 'completed') return null

    if (gen.audioStored) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Cloud className="h-4 w-4 text-green-500" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Stored on CDN</p>
          </TooltipContent>
        </Tooltip>
      )
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <CloudOff className="h-4 w-4 text-yellow-500" />
        </TooltipTrigger>
        <TooltipContent>
          <p>Temporary storage - upload to CDN for permanent access</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Tracks</h1>
          <p className="text-muted-foreground">
            {total} track{total !== 1 ? 's' : ''} generated
          </p>
        </div>
        <Button asChild>
          <Link to="/music">
            <Music className="mr-2 h-4 w-4" />
            Generate New
          </Link>
        </Button>
      </div>

      {/* Track List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Library className="h-5 w-5" />
            Track Library
          </CardTitle>
          <CardDescription>All your AI-generated tracks</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : generations.length > 0 ? (
            <div className="space-y-2">
              {generations.map((gen) => (
                <div
                  key={gen.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors ${
                    playerTrack?.id === gen.id
                      ? 'bg-muted/50 border-primary'
                      : ''
                  }`}
                >
                  {/* Play Button */}
                  <div className="shrink-0">
                    {gen.status === 'completed' && gen.audioUrl ? (
                      <Button
                        size="icon"
                        variant={
                          playerTrack?.id === gen.id ? 'default' : 'outline'
                        }
                        className="h-10 w-10 rounded-full"
                        onClick={() =>
                          setPlayerTrack(
                            playerTrack?.id === gen.id ? null : gen,
                          )
                        }
                      >
                        {playerTrack?.id === gen.id ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4 ml-0.5" />
                        )}
                      </Button>
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Music className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    {editingId === gen.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="h-8"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit()
                            if (e.key === 'Escape') cancelEdit()
                          }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 shrink-0"
                          onClick={saveEdit}
                          disabled={renameMutation.isPending}
                        >
                          {renameMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 shrink-0"
                          onClick={cancelEdit}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">
                            {gen.title || gen.prompt.slice(0, 60)}
                          </p>
                          <TooltipProvider delayDuration={300}>
                            {getCloudStatus(gen)}
                          </TooltipProvider>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {getProviderLabel(gen.provider)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(gen.createdAt).toLocaleDateString()}
                          </span>
                          {getStatusBadge(gen.status)}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  {editingId !== gen.id && (
                    <div className="shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => startEditing(gen)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Rename
                          </DropdownMenuItem>
                          {gen.status === 'completed' && gen.audioUrl && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleDownload(
                                  gen.audioUrl!,
                                  gen.title || 'music',
                                )
                              }
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                          )}
                          {gen.status === 'completed' &&
                            gen.audioUrl &&
                            !gen.audioStored && (
                              <DropdownMenuItem
                                onClick={() => uploadMutation.mutate(gen.id)}
                                disabled={uploadMutation.isPending}
                              >
                                {uploadMutation.isPending ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <CloudUpload className="mr-2 h-4 w-4" />
                                )}
                                Upload to Cloud
                              </DropdownMenuItem>
                            )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteId(gen.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Music className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No tracks yet</h3>
              <p className="text-muted-foreground max-w-md mb-4">
                Your generated music will appear here. Head over to Music
                Generation to create your first track.
              </p>
              <Button asChild>
                <Link to="/music">
                  <Music className="mr-2 h-4 w-4" />
                  Generate Music
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audio Player Dialog */}
      <Dialog open={!!playerTrack} onOpenChange={() => setPlayerTrack(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Now Playing</DialogTitle>
          </DialogHeader>
          {playerTrack && playerTrack.audioUrl && (
            <AudioPlayer
              src={playerTrack.audioUrl}
              title={playerTrack.title || playerTrack.prompt.slice(0, 50)}
              subtitle={getProviderLabel(playerTrack.provider)}
              autoPlay
              onEnded={() => setPlayerTrack(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Track</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this track? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
