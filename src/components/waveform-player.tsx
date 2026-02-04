'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { Play, Pause, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface WaveformPlayerProps {
  src: string
  isVisible?: boolean
  height?: number
  waveColor?: string
  progressColor?: string
  cursorColor?: string
  className?: string
  compact?: boolean
  autoPlay?: boolean
  onReady?: (duration: number) => void
  onPlay?: () => void
  onPause?: () => void
  onFinish?: () => void
  onTimeUpdate?: (currentTime: number) => void
}

export function WaveformPlayer({
  src,
  isVisible = true,
  height = 48,
  waveColor,
  progressColor,
  cursorColor,
  className,
  compact = false,
  autoPlay = false,
  onReady,
  onPlay,
  onPause,
  onFinish,
  onTimeUpdate,
}: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [hasLoaded, setHasLoaded] = useState(false)

  // Format time as mm:ss
  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Initialize WaveSurfer when component becomes visible
  useEffect(() => {
    if (!isVisible || !containerRef.current || hasLoaded) return

    // Use CSS variable colors if not provided
    const computedStyle = getComputedStyle(document.documentElement)
    const defaultWaveColor =
      waveColor || computedStyle.getPropertyValue('--muted-foreground').trim()
        ? 'hsl(var(--muted-foreground) / 0.4)'
        : '#94a3b8'
    const defaultProgressColor = progressColor || 'hsl(var(--primary))'
    const defaultCursorColor = cursorColor || 'hsl(var(--primary))'

    const ws = WaveSurfer.create({
      container: containerRef.current,
      height,
      waveColor: defaultWaveColor,
      progressColor: defaultProgressColor,
      cursorColor: defaultCursorColor,
      cursorWidth: 2,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      normalize: true,
      hideScrollbar: true,
      fillParent: true,
      mediaControls: false,
      autoplay: autoPlay,
    })

    wavesurferRef.current = ws

    // Event handlers
    ws.on('ready', () => {
      setIsLoading(false)
      setHasLoaded(true)
      const dur = ws.getDuration()
      setDuration(dur)
      onReady?.(dur)
    })

    ws.on('play', () => {
      setIsPlaying(true)
      onPlay?.()
    })

    ws.on('pause', () => {
      setIsPlaying(false)
      onPause?.()
    })

    ws.on('finish', () => {
      setIsPlaying(false)
      onFinish?.()
    })

    ws.on('timeupdate', (time) => {
      setCurrentTime(time)
      onTimeUpdate?.(time)
    })

    ws.on('error', (err) => {
      console.error('[WaveformPlayer] Error:', err)
      setError('Failed to load audio')
      setIsLoading(false)
    })

    // Load audio
    ws.load(src)

    return () => {
      ws.destroy()
      wavesurferRef.current = null
    }
  }, [
    isVisible,
    src,
    height,
    waveColor,
    progressColor,
    cursorColor,
    autoPlay,
    hasLoaded,
    onReady,
    onPlay,
    onPause,
    onFinish,
    onTimeUpdate,
  ])

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause()
    }
  }, [])

  // Play from start
  const play = useCallback(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.play()
    }
  }, [])

  // Pause
  const pause = useCallback(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.pause()
    }
  }, [])

  // Seek to position
  const seekTo = useCallback((progress: number) => {
    if (wavesurferRef.current) {
      wavesurferRef.current.seekTo(progress)
    }
  }, [])

  if (error) {
    return (
      <div
        className={cn(
          'flex items-center justify-center text-sm text-muted-foreground',
          className,
        )}
        style={{ height }}
      >
        {error}
      </div>
    )
  }

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0"
          onClick={togglePlayPause}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </Button>

        <div className="flex-1 min-w-0">
          <div
            ref={containerRef}
            className={cn('w-full', isLoading && 'opacity-50')}
            style={{ height }}
          />
        </div>

        <span className="text-xs text-muted-foreground tabular-nums shrink-0 w-20 text-right">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-3">
        <Button
          size="icon"
          variant="outline"
          className="h-10 w-10 shrink-0 rounded-full"
          onClick={togglePlayPause}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>

        <div className="flex-1 min-w-0">
          <div
            ref={containerRef}
            className={cn('w-full', isLoading && 'opacity-50')}
            style={{ height }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="tabular-nums">{formatTime(currentTime)}</span>
        <span className="tabular-nums">{formatTime(duration)}</span>
      </div>
    </div>
  )
}

// Export a lazy version for use with IntersectionObserver
export function LazyWaveformPlayer(
  props: WaveformPlayerProps & { threshold?: number },
) {
  const { threshold = 0.1, ...playerProps } = props
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          // Once visible, stop observing
          observer.disconnect()
        }
      },
      { threshold },
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [threshold])

  return (
    <div ref={containerRef}>
      {isVisible ? (
        <WaveformPlayer {...playerProps} isVisible={isVisible} />
      ) : (
        <div
          className="flex items-center justify-center bg-muted/30 rounded"
          style={{ height: playerProps.height || 48 }}
        >
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  )
}
