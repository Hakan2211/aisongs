/**
 * Generate Demo Tracks for Landing Page
 *
 * One-time script that calls fal.ai to generate 3 demo music tracks:
 *   1. "New Habits" - ElevenLabs (instrumental)
 *   2. "Golden Hour" - MiniMax v2 (about changing habits)
 *   3. "Rise Above" - MiniMax v2 (about believing in yourself)
 *
 * Downloads the resulting MP3 files to public/audio/.
 *
 * Usage:
 *   npm run generate-demos
 */

import { fal } from '@fal-ai/client'
import { writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = resolve(__dirname, '..', 'public', 'audio')

// ============================================================================
// Track Definitions
// ============================================================================

const tracks = [
  {
    name: 'demo-new-habits',
    model: 'fal-ai/elevenlabs/music',
    label: 'New Habits (ElevenLabs)',
    input: {
      prompt:
        'Uplifting indie pop, acoustic guitar, warm piano, hopeful and motivational, morning energy, changing your life, bright and optimistic',
      force_instrumental: true,
      music_length_ms: 30000,
      output_format: 'mp3_44100_128',
    },
  },
  {
    name: 'demo-golden-hour',
    model: 'fal-ai/minimax-music/v2',
    label: 'Golden Hour (MiniMax v2)',
    input: {
      prompt:
        'Lo-fi chill hop, warm vinyl crackle, mellow piano, soft drums, reflective and hopeful, cozy afternoon vibes',
      lyrics_prompt: `[verse]
Woke up today and chose a different road
Let go of weight I didn't need to hold
Small steps forward breaking old routines
Building something better from my dreams

[chorus]
Change your habits change your life
Every morning is a brand new light
One day at a time I'm rewriting the story
Finding peace in the little things`,
    },
  },
  {
    name: 'demo-rise-above',
    model: 'fal-ai/minimax-music/v2',
    label: 'Rise Above (MiniMax v2)',
    input: {
      prompt:
        'Cinematic pop, orchestral strings, powerful drums, inspirational anthem, emotional and uplifting, soaring melody',
      lyrics_prompt: `[verse]
When the world gets heavy and the road feels long
When every voice inside says you don't belong
Look in the mirror see the fire in your eyes
You've been through the storm now it's time to rise

[chorus]
Don't give up on yourself tonight
You're stronger than you know inside
Believe in every step you take
Your heart was never meant to break`,
    },
  },
]

// ============================================================================
// Helpers
// ============================================================================

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function downloadFile(url, outputPath) {
  console.log(`  Downloading: ${url}`)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(
      `Download failed: ${response.status} ${response.statusText}`,
    )
  }
  const buffer = await response.arrayBuffer()
  await writeFile(outputPath, Buffer.from(buffer))
  const sizeMB = (buffer.byteLength / (1024 * 1024)).toFixed(2)
  console.log(`  Saved: ${outputPath} (${sizeMB} MB)`)
}

async function submitAndWait(track) {
  console.log(`\n--- Submitting: ${track.label} ---`)
  console.log(`  Model: ${track.model}`)

  // Submit to queue
  const { request_id } = await fal.queue.submit(track.model, {
    input: track.input,
  })
  console.log(`  Request ID: ${request_id}`)

  // Poll for completion
  let attempts = 0
  const maxAttempts = 120 // 10 minutes max (5s intervals)

  while (attempts < maxAttempts) {
    attempts++
    const status = await fal.queue.status(track.model, {
      requestId: request_id,
      logs: true,
    })

    const statusStr = status.status
    if (statusStr === 'COMPLETED') {
      console.log(`  Status: COMPLETED`)
      const result = await fal.queue.result(track.model, {
        requestId: request_id,
      })
      const audioUrl = result.data?.audio?.url
      if (!audioUrl) {
        throw new Error(`No audio URL in result for ${track.label}`)
      }
      return audioUrl
    } else if (statusStr === 'FAILED') {
      throw new Error(`Generation FAILED for ${track.label}`)
    } else {
      // IN_QUEUE or IN_PROGRESS
      const logs = 'logs' in status ? status.logs : []
      const lastLog = logs?.length > 0 ? logs[logs.length - 1]?.message : ''
      process.stdout.write(
        `\r  Status: ${statusStr} (attempt ${attempts}/${maxAttempts})${lastLog ? ' - ' + lastLog : ''}          `,
      )
    }

    await sleep(5000)
  }

  throw new Error(
    `Timeout waiting for ${track.label} after ${maxAttempts} attempts`,
  )
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  // Check FAL_KEY
  if (!process.env.FAL_KEY) {
    console.error('ERROR: FAL_KEY environment variable is required.')
    console.error('Make sure it is set in .env.local and you run:')
    console.error('  npm run generate-demos')
    process.exit(1)
  }

  fal.config({ credentials: process.env.FAL_KEY })

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true })
  }

  console.log('=== Generating Demo Tracks for Landing Page ===')
  console.log(`Output directory: ${OUTPUT_DIR}`)
  console.log(`Tracks to generate: ${tracks.length}`)

  // Submit all tracks in parallel
  console.log('\nSubmitting all tracks to fal.ai queue...')
  const results = await Promise.allSettled(
    tracks.map(async (track) => {
      const audioUrl = await submitAndWait(track)
      const outputPath = resolve(OUTPUT_DIR, `${track.name}.mp3`)
      await downloadFile(audioUrl, outputPath)
      return { track: track.label, outputPath }
    }),
  )

  // Report results
  console.log('\n\n=== Results ===')
  let allSuccess = true
  for (const result of results) {
    if (result.status === 'fulfilled') {
      console.log(`  OK: ${result.value.track} -> ${result.value.outputPath}`)
    } else {
      console.error(`  FAILED: ${result.reason}`)
      allSuccess = false
    }
  }

  if (allSuccess) {
    console.log('\nAll 3 demo tracks generated successfully!')
    console.log('Files saved to public/audio/')
    console.log('\nNext: Update AudioDemosSection.tsx with the new track data.')
  } else {
    console.error('\nSome tracks failed. Check errors above and re-run.')
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
