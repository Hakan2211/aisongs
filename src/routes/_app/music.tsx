import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  FileAudio,
  Heart,
  Key,
  ListMusic,
  Loader2,
  Mic,
  Music,
  Music2,
  Settings2,
  Sparkles,
  Timer,
  Upload,
  Wand2,
  X,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Track } from '@/components/track-card'
import { VoiceConversionDialog } from '@/components/voice-conversion-dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { TrackCard, TrackCardSkeleton } from '@/components/track-card'
import { LazyWaveformPlayer } from '@/components/waveform-player'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_app/music')({
  component: MusicPage,
})

type MusicProvider = 'elevenlabs' | 'minimax-v2' | 'minimax-v2.5'

interface ConversionSummary {
  id: string
  status: string
  provider: string
  outputAudioUrl: string | null
  outputAudioStored: boolean
  targetSinger: string | null
  rvcModelName: string | null
  pitchShift: number | null
  title: string | null
  error: string | null
  progress: number
  createdAt: string | Date
}

interface Generation extends Track {
  progress: number
  error: string | null
  voiceConversions?: Array<ConversionSummary>
}

// Model configuration for dropdown
const MODELS: Record<
  MusicProvider,
  { name: string; description: string; icon: typeof Music2; apiKey: string }
> = {
  'minimax-v2': {
    name: 'MiniMax v2',
    description: 'Style + Lyrics via fal.ai',
    icon: Music2,
    apiKey: 'fal.ai',
  },
  elevenlabs: {
    name: 'ElevenLabs',
    description: 'Text to Music',
    icon: Wand2,
    apiKey: 'fal.ai',
  },
  'minimax-v2.5': {
    name: 'MiniMax v2.5',
    description: 'Direct API, Latest model',
    icon: Sparkles,
    apiKey: 'MiniMax',
  },
}

function sanitizeFilename(value: string): string {
  const cleaned = value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/\s+/g, ' ')
  return cleaned || 'track'
}

function getExtensionFromUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname
    const lastSegment = pathname.split('/').pop() || ''
    const extension = lastSegment.split('.').pop()
    return extension && extension.length <= 5 ? extension.toLowerCase() : null
  } catch {
    return null
  }
}

function getExtensionFromMime(mime: string): string | null {
  switch (mime) {
    case 'audio/mpeg':
      return 'mp3'
    case 'audio/wav':
    case 'audio/x-wav':
      return 'wav'
    case 'audio/flac':
      return 'flac'
    case 'audio/aac':
      return 'aac'
    case 'audio/ogg':
      return 'ogg'
    case 'audio/webm':
      return 'webm'
    default:
      return null
  }
}

async function downloadAudioToComputer(audioUrl: string, baseName: string) {
  const response = await fetch(audioUrl)
  if (!response.ok) {
    throw new Error(`Download request failed with status ${response.status}`)
  }

  const blob = await response.blob()
  const extensionFromMime = getExtensionFromMime(blob.type)
  const extensionFromUrl = getExtensionFromUrl(audioUrl)
  const extension = extensionFromMime || extensionFromUrl || 'mp3'
  const fileName = `${sanitizeFilename(baseName)}.${extension}`

  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = fileName
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(objectUrl)
}

function MusicPage() {
  const queryClient = useQueryClient()
  const trackListRef = useRef<HTMLDivElement>(null)

  // Form state
  const [provider, setProvider] = useState<MusicProvider>('minimax-v2')
  const [prompt, setPrompt] = useState('')
  const [lyrics, setLyrics] = useState('')
  const [durationMs, setDurationMs] = useState<number | null>(null)
  const [forceInstrumental, setForceInstrumental] = useState(false)

  // Audio quality settings (MiniMax only)
  type SampleRateOption = '16000' | '24000' | '32000' | '44100'
  type BitrateOption = '32000' | '64000' | '128000' | '256000'
  type FormatOption = 'mp3' | 'wav' | 'pcm' | 'flac'

  const [sampleRate, setSampleRate] = useState<SampleRateOption>('44100')
  const [bitrate, setBitrate] = useState<BitrateOption>('256000')
  const [audioFormat, setAudioFormat] = useState<FormatOption>('mp3')
  const [showAudioSettings, setShowAudioSettings] = useState(false)

  // Mobile drawer state
  const [isFormOpen, setIsFormOpen] = useState(false)

  // Filter state
  const [filterTab, setFilterTab] = useState<'all' | 'favorites'>('all')

  // Track action states
  const [togglingFavoriteId, setTogglingFavoriteId] = useState<string | null>(
    null,
  )
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  // Purchase dialog state
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false)

  // Upload dialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

  // Voice conversion dialog state
  const [voiceConversionOpen, setVoiceConversionOpen] = useState(false)
  const [voiceConversionTrackId, setVoiceConversionTrackId] = useState<
    string | null
  >(null)
  const [voiceConversionTrackTitle, setVoiceConversionTrackTitle] = useState('')

  // Fetch active voice conversions
  const { data: voiceConversions, refetch: refetchConversions } = useQuery({
    queryKey: ['voice-conversions'],
    queryFn: async () => {
      const { listVoiceConversionsFn } = await import('@/server/voice.fn')
      return listVoiceConversionsFn()
    },
  })

  const activeConversions = voiceConversions?.filter(
    (c) => c.status === 'processing',
  )
  const hasActiveConversions = activeConversions && activeConversions.length > 0

  // Poll active conversions (sequential to avoid race conditions during CDN upload)
  useEffect(() => {
    if (!hasActiveConversions) return

    let cancelled = false

    const pollConversions = async () => {
      const { checkVoiceConversionStatusFn } = await import('@/server/voice.fn')

      for (const conv of activeConversions) {
        if (cancelled) return
        try {
          const result = await checkVoiceConversionStatusFn({
            data: { conversionId: conv.id },
          })

          if (result.status === 'completed' || result.status === 'failed') {
            refetchConversions()
            queryClient.invalidateQueries({ queryKey: ['generations'] })
            if (result.status === 'completed') {
              toast.success(
                `Voice conversion "${conv.title || 'Untitled'}" complete!`,
              )
            } else if (result.error) {
              toast.error(`Conversion failed: ${result.error}`)
            }
          }
        } catch (error) {
          console.error('Error polling conversion status:', error)
        }
      }

      // Schedule next poll only after current one finishes
      if (!cancelled) {
        timeoutId = setTimeout(pollConversions, 3000)
      }
    }

    let timeoutId = setTimeout(pollConversions, 3000)
    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [hasActiveConversions, activeConversions, refetchConversions, queryClient])

  // Fetch API key status
  const { data: apiKeyStatuses } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const { getAllApiKeyStatusesFn } = await import('@/server/byok.fn')
      return getAllApiKeyStatusesFn()
    },
  })

  // Fetch Bunny status
  const { data: bunnyStatus } = useQuery({
    queryKey: ['bunny-status'],
    queryFn: async () => {
      const { getBunnyStatusFn } = await import('@/server/byok.fn')
      return getBunnyStatusFn()
    },
  })

  // Check for Replicate API key
  const hasReplicateKey =
    apiKeyStatuses?.find((s) => s.provider === 'replicate')?.hasKey ?? false
  const hasBunnySettings = bunnyStatus?.hasKey || false

  // Handle voice conversion
  const handleConvertVoice = useCallback(
    (trackId: string, trackTitle: string) => {
      if (!hasBunnySettings) {
        toast.error(
          'Bunny CDN settings are required for voice conversions. Configure CDN in Settings to prevent audio loss.',
        )
        return
      }
      setVoiceConversionTrackId(trackId)
      setVoiceConversionTrackTitle(trackTitle)
      setVoiceConversionOpen(true)
    },
    [hasBunnySettings],
  )

  // Check platform access (payment gate)
  const { data: platformAccess } = useQuery({
    queryKey: ['platform-access'],
    queryFn: async () => {
      const { checkPlatformAccessFn } = await import('@/server/music.fn')
      return checkPlatformAccessFn()
    },
  })

  const hasPlatformAccess = platformAccess?.hasAccess ?? false

  const hasFalKey = apiKeyStatuses?.find((s) => s.provider === 'fal')?.hasKey
  const hasMiniMaxKey = apiKeyStatuses?.find(
    (s) => s.provider === 'minimax',
  )?.hasKey

  // Check if user has the required key for the selected provider
  const hasRequiredKey = () => {
    if (provider === 'minimax-v2.5') return hasMiniMaxKey
    return hasFalKey
  }

  // Fetch active generations
  const { data: activeGenerations } = useQuery({
    queryKey: ['active-generations'],
    queryFn: async () => {
      const { getActiveGenerationsFn } = await import('@/server/music.fn')
      const result = await getActiveGenerationsFn()
      return result as unknown as Array<Generation>
    },
  })

  // Fetch generations with filter
  const { data: generationsData, isLoading: loadingGenerations } = useQuery({
    queryKey: ['generations', filterTab],
    queryFn: async () => {
      const { listGenerationsFn } = await import('@/server/music.fn')
      const result = await listGenerationsFn({
        data: {
          limit: 100,
          favoritesOnly: filterTab === 'favorites',
        },
      })
      return result as { generations: Array<Generation>; total: number }
    },
  })

  const generations = generationsData?.generations
  const totalTracks = generationsData?.total || 0

  // Poll for status updates on active generations
  useEffect(() => {
    if (!activeGenerations?.length) return

    const pollStatuses = async () => {
      const { checkGenerationStatusFn } = await import('@/server/music.fn')

      for (const gen of activeGenerations) {
        try {
          const status = await checkGenerationStatusFn({
            data: { generationId: gen.id },
          })

          if (status.status === 'completed' || status.status === 'failed') {
            queryClient.invalidateQueries({ queryKey: ['active-generations'] })
            queryClient.invalidateQueries({ queryKey: ['generations'] })

            if (status.status === 'completed') {
              toast.success('Music generation completed!')
            } else if (status.error) {
              toast.error(`Generation failed: ${status.error}`)
            }
          }
        } catch (error) {
          console.error('Error polling status:', error)
        }
      }
    }

    const interval = setInterval(pollStatuses, 3000)
    return () => clearInterval(interval)
  }, [activeGenerations, queryClient])

  const measureRafRef = useRef<number | null>(null)
  const measureTimeoutRef = useRef<number | null>(null)

  // Virtual list setup - use a larger estimate to reduce under-measured starts
  // before dynamic content (details/conversions/waveforms) is fully measured.
  const virtualizer = useVirtualizer({
    count: generations?.length || 0,
    getScrollElement: () => trackListRef.current,
    getItemKey: (index) => generations?.[index]?.id ?? index,
    estimateSize: () => 260,
    overscan: 5,
    gap: 12,
  })

  // Callback to force virtualizer re-measurement when card content changes
  // (e.g. details expanded, waveform loaded, voice conversions added)
  const handleTrackHeightChange = useCallback(() => {
    if (measureRafRef.current !== null) {
      cancelAnimationFrame(measureRafRef.current)
    }
    if (measureTimeoutRef.current !== null) {
      clearTimeout(measureTimeoutRef.current)
    }

    // Double-rAF waits until post-layout paint settles for async content swaps.
    measureRafRef.current = requestAnimationFrame(() => {
      measureRafRef.current = requestAnimationFrame(() => {
        virtualizer.measure()
        measureRafRef.current = null
      })
    })

    // Fallback measure in case a late async layout update misses the rAF window.
    measureTimeoutRef.current = window.setTimeout(() => {
      virtualizer.measure()
      measureTimeoutRef.current = null
    }, 80)
  }, [virtualizer])

  useEffect(() => {
    return () => {
      if (measureRafRef.current !== null) {
        cancelAnimationFrame(measureRafRef.current)
      }
      if (measureTimeoutRef.current !== null) {
        clearTimeout(measureTimeoutRef.current)
      }
    }
  }, [])

  // Re-measure when query results change to keep bottom spacing accurate.
  useEffect(() => {
    handleTrackHeightChange()
  }, [handleTrackHeightChange, generations])

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const { generateMusicFn } = await import('@/server/music.fn')

      const data: {
        provider: MusicProvider
        prompt?: string
        lyrics?: string
        durationMs?: number
        forceInstrumental?: boolean
        audioSettings?: {
          sampleRate?: '16000' | '24000' | '32000' | '44100'
          bitrate?: '32000' | '64000' | '128000' | '256000'
          format?: 'mp3' | 'wav' | 'pcm' | 'flac'
        }
      } = { provider }

      switch (provider) {
        case 'elevenlabs':
          data.prompt = prompt
          if (durationMs !== null) data.durationMs = durationMs
          if (forceInstrumental) data.forceInstrumental = true
          break
        case 'minimax-v2':
          data.prompt = prompt
          data.lyrics = lyrics
          data.audioSettings = { sampleRate, bitrate, format: audioFormat }
          break
        case 'minimax-v2.5':
          data.lyrics = lyrics
          if (prompt.trim()) data.prompt = prompt
          data.audioSettings = { sampleRate, bitrate, format: audioFormat }
          break
      }

      return generateMusicFn({ data })
    },
    onSuccess: (result) => {
      if (result.status === 'failed') {
        toast.error(result.error || 'Generation failed')
      } else {
        toast.success('Generation started!')
        setPrompt('')
        setLyrics('')
        setDurationMs(null)
        setForceInstrumental(false)
        setSampleRate('44100')
        setBitrate('256000')
        setAudioFormat('mp3')
        // Close mobile drawer on success
        setIsFormOpen(false)
      }
      queryClient.invalidateQueries({ queryKey: ['active-generations'] })
      queryClient.invalidateQueries({ queryKey: ['generations'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to start generation')
    },
  })

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (trackId: string) => {
      setTogglingFavoriteId(trackId)
      const { toggleFavoriteFn } = await import('@/server/music.fn')
      return toggleFavoriteFn({ data: { generationId: trackId } })
    },
    onSuccess: (result) => {
      toast.success(
        result.isFavorite ? 'Added to favorites' : 'Removed from favorites',
      )
      queryClient.invalidateQueries({ queryKey: ['generations'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update favorite')
    },
    onSettled: () => {
      setTogglingFavoriteId(null)
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (trackId: string) => {
      setDeletingId(trackId)
      const { deleteGenerationFn } = await import('@/server/music.fn')
      return deleteGenerationFn({ data: { generationId: trackId } })
    },
    onSuccess: () => {
      toast.success('Track deleted')
      queryClient.invalidateQueries({ queryKey: ['generations'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete track')
    },
    onSettled: () => {
      setDeletingId(null)
    },
  })

  // Rename mutation
  const renameMutation = useMutation({
    mutationFn: async ({
      trackId,
      title,
    }: {
      trackId: string
      title: string
    }) => {
      setRenamingId(trackId)
      const { updateGenerationTitleFn } = await import('@/server/music.fn')
      return updateGenerationTitleFn({ data: { generationId: trackId, title } })
    },
    onSuccess: () => {
      toast.success('Track renamed')
      queryClient.invalidateQueries({ queryKey: ['generations'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to rename track')
    },
    onSettled: () => {
      setRenamingId(null)
    },
  })

  // Upload to CDN mutation
  const uploadToCdnMutation = useMutation({
    mutationFn: async (trackId: string) => {
      setUploadingId(trackId)
      const { uploadToCdnFn } = await import('@/server/music.fn')
      return uploadToCdnFn({ data: { generationId: trackId } })
    },
    onSuccess: () => {
      toast.success('Uploaded to CDN')
      queryClient.invalidateQueries({ queryKey: ['generations'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload to CDN')
    },
    onSettled: () => {
      setUploadingId(null)
    },
  })

  // Download handler
  const handleDownload = useCallback(async (track: Track) => {
    if (!track.audioUrl) return
    try {
      await downloadAudioToComputer(track.audioUrl, track.title || 'track')
      toast.success('Download started')
    } catch (error) {
      console.error('Failed to download track:', error)
      toast.error('Failed to download file')
    }
  }, [])

  const handleGenerate = () => {
    switch (provider) {
      case 'elevenlabs':
        if (!prompt.trim()) {
          toast.error('Please enter a music description')
          return
        }
        if (prompt.length < 10) {
          toast.error('Description must be at least 10 characters')
          return
        }
        if (prompt.length > 300) {
          toast.error('Description must be 300 characters or less')
          return
        }
        break
      case 'minimax-v2':
        if (!prompt.trim()) {
          toast.error('Please enter a style prompt')
          return
        }
        if (prompt.length < 10) {
          toast.error('Style prompt must be at least 10 characters')
          return
        }
        if (prompt.length > 300) {
          toast.error('Style prompt must be 300 characters or less')
          return
        }
        if (!lyrics.trim()) {
          toast.error('Please enter lyrics')
          return
        }
        if (lyrics.length < 10) {
          toast.error('Lyrics must be at least 10 characters')
          return
        }
        if (lyrics.length > 3000) {
          toast.error('Lyrics must be 3000 characters or less')
          return
        }
        break
      case 'minimax-v2.5':
        if (!lyrics.trim()) {
          toast.error('Please enter lyrics')
          return
        }
        if (lyrics.length > 3500) {
          toast.error('Lyrics must be 3500 characters or less')
          return
        }
        if (prompt.length > 2000) {
          toast.error('Style prompt must be 2000 characters or less')
          return
        }
        break
    }
    generateMutation.mutate()
  }

  const isGenerating = generateMutation.isPending
  const hasActiveGenerations = activeGenerations && activeGenerations.length > 0
  const needsLyrics = provider === 'minimax-v2' || provider === 'minimax-v2.5'
  const needsPrompt = provider === 'elevenlabs' || provider === 'minimax-v2'

  const getPromptLimit = () => {
    if (provider === 'elevenlabs' || provider === 'minimax-v2') return 300
    return 2000
  }

  const getLyricsLimit = () => {
    if (provider === 'minimax-v2') return 3000
    return 3500
  }

  const getPromptPlaceholder = () => {
    if (provider === 'elevenlabs') {
      return 'Upbeat electronic dance track with energetic synths and driving bass...'
    }
    if (provider === 'minimax-v2') {
      return 'Upbeat pop song with acoustic guitar and soft vocals...'
    }
    return 'Optional: Soft acoustic ballad with piano... (leave empty to auto-detect from lyrics)'
  }

  const currentModel = MODELS[provider]
  const CurrentModelIcon = currentModel.icon

  // Form content component - used in both desktop dock and mobile drawer
  const FormContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={cn('space-y-4', isMobile && 'pb-6')}>
      {/* Row 1: Model Select + Prompt */}
      <div className={cn('flex gap-3', isMobile ? 'flex-col' : 'items-start')}>
        {/* Model Dropdown */}
        <Select
          value={provider}
          onValueChange={(v) => setProvider(v as MusicProvider)}
        >
          <SelectTrigger
            className={cn(
              'h-auto py-2.5',
              isMobile ? 'w-full' : 'w-[200px] shrink-0',
            )}
          >
            <SelectValue>
              <div className="flex items-center gap-2">
                <CurrentModelIcon className="h-4 w-4 text-primary" />
                <span className="font-medium">{currentModel.name}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(
              Object.entries(MODELS) as Array<
                [MusicProvider, (typeof MODELS)[MusicProvider]]
              >
            ).map(([key, model]) => {
              const Icon = model.icon
              return (
                <SelectItem key={key} value={key} className="py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{model.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {model.description}
                      </span>
                    </div>
                    <div className="ml-auto pl-4 flex items-center">
                      <Key className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground ml-1">
                        {model.apiKey}
                      </span>
                    </div>
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>

        {/* Prompt/Style Input */}
        <div className="flex-1 space-y-1">
          <Textarea
            placeholder={getPromptPlaceholder()}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            disabled={isGenerating}
            className="resize-none min-h-[72px]"
          />
          {needsPrompt && (
            <p className="text-[11px] text-muted-foreground text-right tabular-nums">
              {prompt.length}/{getPromptLimit()}
            </p>
          )}
        </div>
      </div>

      {/* ElevenLabs: Duration + Instrumental Controls */}
      {provider === 'elevenlabs' && (
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 text-sm">
                <Timer className="h-3.5 w-3.5" />
                Duration
              </Label>
              <span className="text-xs font-medium tabular-nums">
                {durationMs === null
                  ? 'Auto'
                  : `${Math.round(durationMs / 1000)}s`}
              </span>
            </div>
            <Slider
              min={0}
              max={600}
              step={5}
              value={[durationMs === null ? 0 : Math.round(durationMs / 1000)]}
              onValueChange={([val]) =>
                setDurationMs(val === 0 ? null : val * 1000)
              }
              disabled={isGenerating}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm">
              <Mic className="h-3.5 w-3.5" />
              Instrumental Only
            </Label>
            <div className="flex items-center gap-2 pt-1">
              <Switch
                checked={forceInstrumental}
                onCheckedChange={setForceInstrumental}
                disabled={isGenerating}
              />
              <span className="text-xs text-muted-foreground">
                {forceInstrumental ? 'No vocals' : 'With vocals'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Lyrics Field (MiniMax only) - Always visible */}
      {needsLyrics && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Lyrics</Label>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {lyrics.length}/{getLyricsLimit()}
            </span>
          </div>
          <Textarea
            placeholder={`[Verse]
Walking down the street tonight
Stars are shining oh so bright

[Chorus]
This is where we belong
Singing our favorite song`}
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            rows={4}
            disabled={isGenerating}
            className="resize-none font-mono text-sm"
          />
          <p className="text-[11px] text-muted-foreground">
            Use [Verse], [Chorus], [Bridge], [Intro], [Outro] tags
          </p>
        </div>
      )}

      {/* Audio Settings (MiniMax only) */}
      {needsLyrics && (
        <Collapsible
          open={showAudioSettings}
          onOpenChange={setShowAudioSettings}
        >
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex items-center justify-between w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              disabled={isGenerating}
            >
              <span className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Audio Quality Settings
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform duration-200',
                  showAudioSettings && 'rotate-180',
                )}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Sample Rate
                </Label>
                <Select
                  value={sampleRate}
                  onValueChange={(v) => setSampleRate(v as SampleRateOption)}
                  disabled={isGenerating}
                >
                  <SelectTrigger size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16000">16 kHz</SelectItem>
                    <SelectItem value="24000">24 kHz</SelectItem>
                    <SelectItem value="32000">32 kHz</SelectItem>
                    <SelectItem value="44100">44.1 kHz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Bitrate</Label>
                <Select
                  value={bitrate}
                  onValueChange={(v) => setBitrate(v as BitrateOption)}
                  disabled={isGenerating}
                >
                  <SelectTrigger size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="32000">32 kbps</SelectItem>
                    <SelectItem value="64000">64 kbps</SelectItem>
                    <SelectItem value="128000">128 kbps</SelectItem>
                    <SelectItem value="256000">256 kbps</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Format</Label>
                <Select
                  value={audioFormat}
                  onValueChange={(v) => setAudioFormat(v as FormatOption)}
                  disabled={isGenerating}
                >
                  <SelectTrigger size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mp3">MP3</SelectItem>
                    <SelectItem value="wav">WAV</SelectItem>
                    <SelectItem value="pcm">PCM</SelectItem>
                    {provider === 'minimax-v2' && (
                      <SelectItem value="flac">FLAC</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Action Buttons */}
      {!hasPlatformAccess ? (
        <Button
          onClick={() => setPurchaseDialogOpen(true)}
          size="xl"
          className="w-full"
        >
          <Zap className="h-4 w-4" />
          Unlock Generation
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !hasRequiredKey()}
            size="xl"
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Music
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="xl"
            onClick={() => {
              if (!hasBunnySettings) {
                toast.error(
                  'Bunny CDN settings are required to upload tracks. Configure CDN in Settings.',
                )
                return
              }
              setUploadDialogOpen(true)
            }}
            title="Upload your own track"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden lg:inline">Upload</span>
          </Button>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Header */}
      <div className="shrink-0 py-4 px-1">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/5">
            <Music className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Create Music
            </h1>
            <p className="text-sm text-muted-foreground">
              Generate AI-powered music with your own API keys
            </p>
          </div>
        </div>
      </div>

      {/* API Key Warning */}
      {hasPlatformAccess && !hasRequiredKey() && (
        <div className="shrink-0 px-1 pb-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                API Key Required
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {provider === 'minimax-v2.5' ? 'MiniMax' : 'fal.ai'} API key
                required.{' '}
                <Link
                  to="/settings"
                  className="underline font-medium hover:no-underline"
                >
                  Add in Settings
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* In Progress Section - Above tracks */}
      {hasActiveGenerations && (
        <div className="shrink-0 px-1 pb-3">
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/50">
            <CardContent className="py-3">
              <div className="flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Generating
                </span>
              </div>
              <div className="mt-2 space-y-1.5">
                {activeGenerations.map((gen) => (
                  <div
                    key={gen.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-blue-700 dark:text-blue-300 truncate flex-1">
                      {gen.title || gen.prompt?.slice(0, 40) || 'Untitled'}...
                    </span>
                    <span className="text-blue-600 dark:text-blue-400 font-medium tabular-nums ml-3">
                      {gen.progress || 0}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Voice Conversions */}
      {hasActiveConversions && (
        <div className="shrink-0 px-1 pb-3">
          <Card className="border-violet-200 bg-violet-50 dark:border-violet-900 dark:bg-violet-950/50">
            <CardContent className="py-3">
              <div className="flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-violet-600 dark:text-violet-400" />
                <span className="text-sm font-medium text-violet-900 dark:text-violet-100">
                  Voice Conversions
                </span>
              </div>
              <div className="mt-2 space-y-1.5">
                {activeConversions.map((conv) => (
                  <div
                    key={conv.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-violet-700 dark:text-violet-300 truncate flex-1">
                      {conv.title || 'Voice Conversion'}
                    </span>
                    <span className="text-violet-600 dark:text-violet-400 font-medium tabular-nums ml-3">
                      {conv.progress || 0}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Track List Section - Takes remaining space */}
      <div className="flex-1 min-h-0 flex flex-col px-1">
        {/* Filter Tabs Header */}
        <div className="flex items-center justify-between mb-3">
          <Tabs
            value={filterTab}
            onValueChange={(v) => setFilterTab(v as 'all' | 'favorites')}
          >
            <TabsList>
              <TabsTrigger value="all" className="gap-2">
                <ListMusic className="h-4 w-4" />
                All Tracks
              </TabsTrigger>
              <TabsTrigger value="favorites" className="gap-2">
                <Heart className="h-4 w-4" />
                Favorites
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <span className="text-sm text-muted-foreground tabular-nums">
            {totalTracks} {totalTracks === 1 ? 'track' : 'tracks'}
          </span>
        </div>

        {/* Scrollable Track List */}
        <div
          ref={trackListRef}
          className="flex-1 overflow-auto rounded-2xl border bg-muted/30 mb-4 md:mb-0"
          style={{ overflowAnchor: 'none' }}
        >
          {loadingGenerations ? (
            <div className="p-4 space-y-3">
              <TrackCardSkeleton />
              <TrackCardSkeleton />
              <TrackCardSkeleton />
              <TrackCardSkeleton />
            </div>
          ) : generations && generations.length > 0 ? (
            <div className="py-3">
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {virtualizer.getVirtualItems().map((virtualItem) => {
                  const track = generations[virtualItem.index]
                  return (
                    <div
                      key={virtualItem.key}
                      ref={virtualizer.measureElement}
                      data-index={virtualItem.index}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                      className="px-4"
                    >
                      <TrackCard
                        track={track}
                        onToggleFavorite={(id) =>
                          toggleFavoriteMutation.mutate(id)
                        }
                        onDelete={(id) => deleteMutation.mutate(id)}
                        onRename={(id, title) =>
                          renameMutation.mutate({ trackId: id, title })
                        }
                        onUploadToCdn={(id) => uploadToCdnMutation.mutate(id)}
                        onDownload={handleDownload}
                        onConvertVoice={handleConvertVoice}
                        onHeightChange={handleTrackHeightChange}
                        isTogglingFavorite={togglingFavoriteId === track.id}
                        isDeleting={deletingId === track.id}
                        isRenaming={renamingId === track.id}
                        isUploading={uploadingId === track.id}
                        hasBunnySettings={hasBunnySettings}
                        hasReplicateKey={hasReplicateKey}
                      />

                      {/* Nested Voice Conversions */}
                      {track.voiceConversions &&
                        track.voiceConversions.length > 0 && (
                          <div className="mt-3 ml-4 space-y-3">
                            {track.voiceConversions.map((conversion) => {
                              const isCompleted =
                                conversion.status === 'completed'
                              const isProcessing =
                                conversion.status === 'processing'
                              const isFailed = conversion.status === 'failed'
                              const voiceName =
                                conversion.rvcModelName ||
                                conversion.targetSinger ||
                                'Custom Voice'

                              return (
                                <div
                                  key={conversion.id}
                                  className="rounded-xl border bg-card p-3 space-y-2"
                                >
                                  {/* Header row */}
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Mic className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                                      <span className="text-sm font-medium truncate">
                                        {voiceName}
                                      </span>
                                      {conversion.pitchShift !== null &&
                                        conversion.pitchShift !== 0 && (
                                          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                                            {conversion.pitchShift > 0
                                              ? `+${conversion.pitchShift}`
                                              : conversion.pitchShift}
                                            st
                                          </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <Badge
                                        variant={
                                          isCompleted
                                            ? 'default'
                                            : isFailed
                                              ? 'destructive'
                                              : 'secondary'
                                        }
                                        className="text-[10px] px-1.5 py-0"
                                      >
                                        {conversion.status}
                                      </Badge>
                                      {isCompleted &&
                                        conversion.outputAudioUrl && (
                                          <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            className="h-7 w-7"
                                            onClick={async () => {
                                              try {
                                                await downloadAudioToComputer(
                                                  conversion.outputAudioUrl!,
                                                  voiceName,
                                                )
                                                toast.success(
                                                  'Download started',
                                                )
                                              } catch (error) {
                                                console.error(
                                                  'Failed to download conversion:',
                                                  error,
                                                )
                                                toast.error(
                                                  'Failed to download conversion',
                                                )
                                              }
                                            }}
                                            title="Download conversion"
                                          >
                                            <Download className="h-3.5 w-3.5" />
                                          </Button>
                                        )}
                                    </div>
                                  </div>

                                  {/* Audio Player */}
                                  {isCompleted && conversion.outputAudioUrl && (
                                    <LazyWaveformPlayer
                                      src={conversion.outputAudioUrl}
                                      height={32}
                                      compact
                                      threshold={0.1}
                                      onLoad={handleTrackHeightChange}
                                    />
                                  )}

                                  {/* Processing indicator */}
                                  {isProcessing && (
                                    <div className="flex items-center gap-3">
                                      <Loader2 className="h-3 w-3 animate-spin text-violet-500 shrink-0" />
                                      <div className="relative h-1 flex-1 bg-muted rounded-full overflow-hidden">
                                        <div
                                          className="absolute inset-y-0 left-0 bg-violet-500/50 rounded-full transition-all"
                                          style={{
                                            width: `${conversion.progress}%`,
                                          }}
                                        />
                                      </div>
                                      <span className="text-xs text-muted-foreground tabular-nums">
                                        {conversion.progress}%
                                      </span>
                                    </div>
                                  )}

                                  {/* Error */}
                                  {isFailed && conversion.error && (
                                    <div className="text-xs text-red-500 bg-red-500/10 p-2 rounded-lg">
                                      {conversion.error}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="rounded-2xl bg-muted/50 p-5 mb-5">
                <Music className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                {filterTab === 'favorites'
                  ? 'No favorites yet'
                  : 'No tracks yet'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {filterTab === 'favorites'
                  ? 'Heart your favorite tracks to see them here'
                  : 'Generate your first AI track or upload your own audio below'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* DESKTOP: Sticky Bottom Form (Dock Style)    */}
      {/* ============================================ */}
      <div className="hidden md:block shrink-0 sticky bottom-0 z-10 bg-muted/80 backdrop-blur-md border-t shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.3)]">
        <div className="px-4 py-4">
          <Card className="shadow-lg border-border/50">
            <CardContent className="pt-4 pb-4">
              <FormContent />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ============================================ */}
      {/* MOBILE: Drawer Trigger + Bottom Sheet       */}
      {/* ============================================ */}
      <div className="md:hidden">
        <Drawer open={isFormOpen} onOpenChange={setIsFormOpen}>
          {/* Trigger - Sticky bar at bottom */}
          <div className="sticky bottom-0 z-10 bg-muted/80 backdrop-blur-md border-t shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)]">
            <DrawerTrigger asChild>
              <button className="w-full p-4 flex items-center justify-center gap-2 text-primary font-medium active:bg-muted/50 transition-colors">
                <Sparkles className="h-5 w-5" />
                <span>Create New Track</span>
                <ChevronUp className="h-4 w-4 ml-1" />
              </button>
            </DrawerTrigger>
          </div>

          {/* Drawer Content */}
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader className="text-left pb-2">
              <DrawerTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Create New Track
              </DrawerTitle>
            </DrawerHeader>

            <div className="px-4 overflow-y-auto">
              <FormContent isMobile />
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Voice Conversion Dialog */}
      {voiceConversionTrackId && (
        <VoiceConversionDialog
          open={voiceConversionOpen}
          onOpenChange={setVoiceConversionOpen}
          sourceGenerationId={voiceConversionTrackId}
          sourceTitle={voiceConversionTrackTitle}
        />
      )}

      {/* Purchase Access Dialog */}
      <PurchaseDialog
        open={purchaseDialogOpen}
        onOpenChange={setPurchaseDialogOpen}
      />

      {/* Upload Track Dialog */}
      <UploadTrackDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['generations'] })
        }}
      />
    </div>
  )
}

function PurchaseDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const { createCheckoutFn } = await import('@/server/billing.fn')
      return createCheckoutFn({ data: {} })
    },
    onSuccess: (result) => {
      if (result.url) {
        window.location.href = result.url
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to start checkout')
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Unlock Songlar</DialogTitle>
          <DialogDescription>
            One-time payment for lifetime access to all features.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Features list */}
          <ul className="space-y-3">
            {[
              'Unlimited AI music generation',
              'Multiple AI models (ElevenLabs, MiniMax)',
              'Voice cloning & conversion',
              'CDN storage for your tracks',
              'All future updates included',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm">
                <div className="rounded-full bg-primary/10 p-1">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                {feature}
              </li>
            ))}
          </ul>

          {/* Price */}
          <div className="rounded-xl border bg-muted/50 p-4 text-center">
            <div className="text-3xl font-bold tracking-tight">&euro;199</div>
            <p className="text-sm text-muted-foreground mt-1">
              One-time payment &middot; Lifetime access
            </p>
          </div>

          {/* CTA */}
          <Button
            onClick={() => checkoutMutation.mutate()}
            disabled={checkoutMutation.isPending}
            size="xl"
            className="w-full"
          >
            {checkoutMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Redirecting to checkout...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Purchase Lifetime Access
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Secure payment via Stripe. You bring your own API keys for AI
            generation.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const ACCEPTED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/flac',
  'audio/ogg',
  'audio/aac',
  'audio/webm',
  'audio/mp4',
]

const MAX_FILE_SIZE_MB = 50
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

function UploadTrackDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [dragActive, setDragActive] = useState(false)

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('No file selected')

      // Read file as base64
      const arrayBuffer = await selectedFile.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      // Convert to base64 in chunks to avoid call stack limits
      const chunkSize = 8192
      let binary = ''
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, i + chunkSize)
        binary += String.fromCharCode(...chunk)
      }
      const base64 = btoa(binary)

      const { uploadTrackFn } = await import('@/server/music.fn')
      return uploadTrackFn({
        data: {
          audioBase64: base64,
          filename: selectedFile.name,
          contentType: selectedFile.type || 'audio/mpeg',
          title: title.trim() || undefined,
        },
      })
    },
    onSuccess: (result) => {
      toast.success(`"${result.title || 'Track'}" uploaded successfully!`)
      onSuccess()
      handleClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload track')
    },
  })

  const handleClose = () => {
    if (uploadMutation.isPending) return
    setSelectedFile(null)
    setTitle('')
    setDragActive(false)
    onOpenChange(false)
  }

  const validateAndSetFile = (file: File) => {
    if (!ACCEPTED_AUDIO_TYPES.includes(file.type)) {
      toast.error(
        'Unsupported file format. Please upload MP3, WAV, FLAC, OGG, AAC, or WebM.',
      )
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`)
      return
    }

    setSelectedFile(file)
    // Auto-fill title from filename (without extension)
    if (!title) {
      setTitle(file.name.replace(/\.[^.]+$/, ''))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) validateAndSetFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) validateAndSetFile(file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload Track
          </DialogTitle>
          <DialogDescription>
            Upload your own audio file. It will be stored on your Bunny CDN and
            available for voice conversion.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Drop Zone / File Input */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors',
              dragActive
                ? 'border-primary bg-primary/5'
                : selectedFile
                  ? 'border-green-500/50 bg-green-500/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50',
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploadMutation.isPending}
            />

            {selectedFile ? (
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="rounded-full bg-green-500/10 p-3">
                  <FileAudio className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium truncate max-w-[280px]">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedFile(null)
                    setTitle('')
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  disabled={uploadMutation.isPending}
                >
                  <X className="h-3 w-3 mr-1" />
                  Remove
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="rounded-full bg-muted p-3">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    Drop audio file here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    MP3, WAV, FLAC, OGG, AAC, WebM &middot; Max{' '}
                    {MAX_FILE_SIZE_MB}MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Title Input */}
          {selectedFile && (
            <div className="space-y-1.5">
              <Label className="text-sm">Track Title</Label>
              <Input
                placeholder="Enter a title for this track"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                disabled={uploadMutation.isPending}
              />
            </div>
          )}

          {/* Upload Button */}
          <Button
            onClick={() => uploadMutation.mutate()}
            disabled={!selectedFile || uploadMutation.isPending}
            size="xl"
            className="w-full"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Track
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
