'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, User, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface VoiceConversionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceGenerationId: string
  sourceTitle: string
}

// Amphion SVC singers grouped by category
const SINGER_CATEGORIES = {
  International: [
    { id: 'Adele', name: 'Adele' },
    { id: 'John Mayer', name: 'John Mayer' },
    { id: 'Bruno Mars', name: 'Bruno Mars' },
    { id: 'Beyonce', name: 'Beyonce' },
    { id: 'Michael Jackson', name: 'Michael Jackson' },
    { id: 'Taylor Swift', name: 'Taylor Swift' },
  ],
  Chinese: [
    { id: 'David Tao', name: 'David Tao' },
    { id: 'Eason Chan', name: 'Eason Chan' },
    { id: 'Feng Wang', name: 'Feng Wang' },
    { id: 'Jian Li', name: 'Jian Li' },
    { id: 'Ying Na', name: 'Ying Na' },
    { id: 'Yijie Shi', name: 'Yijie Shi' },
    { id: 'Jacky Cheung', name: 'Jacky Cheung' },
    { id: 'Faye Wong', name: 'Faye Wong' },
    { id: 'Tsai Chin', name: 'Tsai Chin' },
  ],
}

export function VoiceConversionDialog({
  open,
  onOpenChange,
  sourceGenerationId,
  sourceTitle,
}: VoiceConversionDialogProps) {
  const queryClient = useQueryClient()

  // Form state
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset')
  const [selectedSinger, setSelectedSinger] = useState<string | null>(null)
  const [rvcModelUrl, setRvcModelUrl] = useState('')
  const [rvcModelName, setRvcModelName] = useState('')
  const [pitchShift, setPitchShift] = useState(0)

  // Start conversion mutation
  const startConversionMutation = useMutation({
    mutationFn: async () => {
      const { startVoiceConversionFn } = await import('@/server/voice.fn')

      if (activeTab === 'preset') {
        if (!selectedSinger) {
          throw new Error('Please select a singer')
        }
        return startVoiceConversionFn({
          data: {
            provider: 'amphion-svc',
            sourceGenerationId,
            targetSinger: selectedSinger,
            pitchShift: pitchShift !== 0 ? pitchShift : undefined,
          },
        })
      } else {
        if (!rvcModelUrl) {
          throw new Error('Please enter an RVC model URL')
        }
        return startVoiceConversionFn({
          data: {
            provider: 'rvc-v2',
            sourceGenerationId,
            rvcModelUrl,
            rvcModelName: rvcModelName || undefined,
            pitchShift: pitchShift !== 0 ? pitchShift : undefined,
          },
        })
      }
    },
    onSuccess: () => {
      toast.success('Voice conversion started!')
      queryClient.invalidateQueries({ queryKey: ['voice-conversions'] })
      onOpenChange(false)
      // Reset form
      setSelectedSinger(null)
      setRvcModelUrl('')
      setRvcModelName('')
      setPitchShift(0)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to start conversion')
    },
  })

  const handleSubmit = () => {
    startConversionMutation.mutate()
  }

  const isValid =
    activeTab === 'preset' ? !!selectedSinger : !!rvcModelUrl.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Convert Voice
          </DialogTitle>
          <DialogDescription>
            Change the singing voice in &quot;{sourceTitle}&quot;
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'preset' | 'custom')}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preset">Preset Singers</TabsTrigger>
            <TabsTrigger value="custom">Custom RVC Model</TabsTrigger>
          </TabsList>

          <TabsContent value="preset" className="mt-4">
            <div className="space-y-4">
              {/* International Singers */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  International
                </Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {SINGER_CATEGORIES.International.map((singer) => (
                    <button
                      key={singer.id}
                      type="button"
                      onClick={() => setSelectedSinger(singer.id)}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-lg border text-sm transition-all',
                        selectedSinger === singer.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50',
                      )}
                    >
                      <User className="h-4 w-4 shrink-0" />
                      <span className="truncate">{singer.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chinese Singers */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Chinese
                </Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {SINGER_CATEGORIES.Chinese.map((singer) => (
                    <button
                      key={singer.id}
                      type="button"
                      onClick={() => setSelectedSinger(singer.id)}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-lg border text-sm transition-all',
                        selectedSinger === singer.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50',
                      )}
                    >
                      <User className="h-4 w-4 shrink-0" />
                      <span className="truncate">{singer.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="custom" className="mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rvc-model-url">RVC Model URL</Label>
                <Input
                  id="rvc-model-url"
                  placeholder="https://huggingface.co/..."
                  value={rvcModelUrl}
                  onChange={(e) => setRvcModelUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter a HuggingFace URL to a .zip file containing an RVC v2
                  model
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rvc-model-name">Model Name (optional)</Label>
                <Input
                  id="rvc-model-name"
                  placeholder="My Custom Voice"
                  value={rvcModelName}
                  onChange={(e) => setRvcModelName(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Pitch Shift */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <Label>Pitch Shift</Label>
            <span className="text-sm text-muted-foreground tabular-nums">
              {pitchShift > 0 ? '+' : ''}
              {pitchShift} semitones
            </span>
          </div>
          <Slider
            value={[pitchShift]}
            onValueChange={([v]) => setPitchShift(v)}
            min={-12}
            max={12}
            step={1}
          />
          <p className="text-xs text-muted-foreground">
            Adjust the pitch of the converted voice. Positive values raise the
            pitch, negative values lower it.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || startConversionMutation.isPending}
          >
            {startConversionMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Convert Voice
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
