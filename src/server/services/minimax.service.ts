/**
 * MiniMax Direct API Service
 *
 * Direct integration with MiniMax Music v2.5 API.
 * This bypasses fal.ai and calls MiniMax API directly.
 *
 * API Documentation: https://platform.minimax.io/docs/api-reference/music-generation
 *
 * Note: Unlike fal.ai queue-based approach, MiniMax v2.5 API is synchronous
 * and returns the audio directly in the response.
 */

// ============================================================================
// Configuration
// ============================================================================

const MOCK_MINIMAX = process.env.MOCK_MINIMAX === 'true'
const MINIMAX_API_BASE = 'https://api.minimax.io'

// Mock audio URL for development
const MOCK_AUDIO_URL =
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'

// ============================================================================
// Types
// ============================================================================

export interface MiniMaxAudioSettings {
  sampleRate?: 16000 | 24000 | 32000 | 44100
  bitrate?: 32000 | 64000 | 128000 | 256000
  format?: 'mp3' | 'wav' | 'pcm'
}

export interface MiniMaxGenerationInput {
  prompt?: string // Style description (optional, 0-2000 chars)
  lyrics: string // Required (1-3500 chars)
  audioSettings?: MiniMaxAudioSettings
}

export interface MiniMaxGenerationResult {
  success: boolean
  audioUrl?: string
  audioHex?: string
  duration?: number
  sampleRate?: number
  channels?: number
  bitrate?: number
  fileSize?: number
  error?: string
  errorCode?: number
}

interface MiniMaxAPIResponse {
  data?: {
    audio?: string // hex-encoded audio or URL
    status?: number // 1 = in progress, 2 = completed
  }
  extra_info?: {
    music_duration?: number
    music_sample_rate?: number
    music_channel?: number
    bitrate?: number
    music_size?: number
  }
  base_resp?: {
    status_code: number
    status_msg: string
  }
}

// ============================================================================
// Mock Implementation
// ============================================================================

async function mockSubmitGeneration(
  input: MiniMaxGenerationInput,
): Promise<MiniMaxGenerationResult> {
  console.log('[MOCK MiniMax] Generation submitted:', {
    promptLength: input.prompt?.length,
    lyricsLength: input.lyrics.length,
  })

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  return {
    success: true,
    audioUrl: MOCK_AUDIO_URL,
    duration: 30000,
    sampleRate: 44100,
    channels: 2,
    bitrate: 256000,
  }
}

// ============================================================================
// MiniMax API Implementation
// ============================================================================

/**
 * Submit music generation to MiniMax v2.5 API
 *
 * The API is synchronous - it will block until generation is complete
 * and return the audio data directly.
 */
async function submitToMiniMax(
  apiKey: string,
  input: MiniMaxGenerationInput,
): Promise<MiniMaxGenerationResult> {
  const url = `${MINIMAX_API_BASE}/v1/music_generation`

  const payload: Record<string, unknown> = {
    model: 'music-2.5',
    lyrics: input.lyrics,
    output_format: 'url', // Request URL instead of hex for easier handling
  }

  // Add optional prompt if provided
  if (input.prompt && input.prompt.trim()) {
    payload.prompt = input.prompt.trim()
  }

  // Add audio settings if provided
  if (input.audioSettings) {
    payload.audio_setting = {
      sample_rate: input.audioSettings.sampleRate || 44100,
      bitrate: input.audioSettings.bitrate || 256000,
      format: input.audioSettings.format || 'mp3',
    }
  } else {
    // Default audio settings
    payload.audio_setting = {
      sample_rate: 44100,
      bitrate: 256000,
      format: 'mp3',
    }
  }

  console.log('[MiniMax] Submitting generation to API...')

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    const data: MiniMaxAPIResponse = await response.json()

    // Check for API errors
    if (data.base_resp && data.base_resp.status_code !== 0) {
      const errorMsg = getMiniMaxErrorMessage(
        data.base_resp.status_code,
        data.base_resp.status_msg,
      )
      console.error('[MiniMax] API error:', errorMsg)
      return {
        success: false,
        error: errorMsg,
        errorCode: data.base_resp.status_code,
      }
    }

    // Check if generation completed
    if (data.data?.status !== 2) {
      return {
        success: false,
        error: 'Generation did not complete',
      }
    }

    // Extract audio URL or hex data
    const audioData = data.data.audio
    if (!audioData) {
      return {
        success: false,
        error: 'No audio data in response',
      }
    }

    console.log('[MiniMax] Generation successful')

    return {
      success: true,
      audioUrl: audioData, // When output_format is 'url', this is the URL
      duration: data.extra_info?.music_duration,
      sampleRate: data.extra_info?.music_sample_rate,
      channels: data.extra_info?.music_channel,
      bitrate: data.extra_info?.bitrate,
      fileSize: data.extra_info?.music_size,
    }
  } catch (error) {
    console.error('[MiniMax] Request failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Request failed',
    }
  }
}

/**
 * Get human-readable error message from MiniMax error codes
 */
function getMiniMaxErrorMessage(code: number, msg: string): string {
  switch (code) {
    case 1002:
      return 'Rate limit exceeded. Please try again later.'
    case 1004:
      return 'Authentication failed. Please check your API key.'
    case 1008:
      return 'Insufficient balance. Please top up your MiniMax account.'
    case 1026:
      return 'Content flagged for sensitive material.'
    case 2013:
      return 'Invalid parameters. Please check your input.'
    case 2049:
      return 'Invalid API key.'
    default:
      return msg || `Unknown error (code: ${code})`
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Generate music using MiniMax v2.5 direct API
 */
export async function generateMusicWithMiniMax(
  apiKey: string | null,
  input: MiniMaxGenerationInput,
): Promise<MiniMaxGenerationResult> {
  // Validate input
  if (!input.lyrics || input.lyrics.trim().length === 0) {
    return {
      success: false,
      error: 'Lyrics are required for MiniMax v2.5',
    }
  }

  if (input.lyrics.length > 3500) {
    return {
      success: false,
      error: 'Lyrics must be 3500 characters or less',
    }
  }

  if (input.prompt && input.prompt.length > 2000) {
    return {
      success: false,
      error: 'Prompt must be 2000 characters or less',
    }
  }

  if (MOCK_MINIMAX) {
    return mockSubmitGeneration(input)
  }

  if (!apiKey) {
    return {
      success: false,
      error: 'MiniMax API key is required',
    }
  }

  return submitToMiniMax(apiKey, input)
}

/**
 * Check if MiniMax service is in mock mode
 */
export function isMiniMaxMockMode(): boolean {
  return MOCK_MINIMAX
}
