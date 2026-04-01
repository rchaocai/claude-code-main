import { getGlobalConfig } from '../../utils/config.js'
import { getCompanion } from '../../buddy/companion.js'
import type { Companion } from '../../buddy/types.js'

export const command = 'buddy'
export const describe = 'Manage your Buddy companion'
export const builder = {}

export async function handler() {
  const config = getGlobalConfig()
  const companion = getCompanion()

  if (!companion) {
    console.log('No companion found. Starting a new one...')
    // Create companion
    config.companion = {
      name: 'Buddy',
      personality: 'A faithful companion on your coding journey',
      hatchedAt: Date.now(),
    }
    console.log('Buddy hatched! 🎉')
    return
  }

  console.log(`Your Buddy: ${companion.name}`)
  console.log(`Species: ${companion.species}`)
  console.log(`Rarity: ${companion.rarity}`)
  console.log(`Personality: ${companion.personality}`)
}
