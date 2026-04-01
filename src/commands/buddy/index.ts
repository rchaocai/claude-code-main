import type { Command, LocalCommandCall } from '../../types/command.js'
import { getCompanion, rollWithSeed } from '../../buddy/companion.js'
import type { Rarity } from '../../buddy/types.js'
import { RARITIES, RARITY_STARS } from '../../buddy/types.js'
import { getGlobalConfig } from '../../utils/config.js'
import { writeFileSyncAndFlush_DEPRECATED } from '../../utils/file.js'
import { jsonStringify } from '../../utils/slowOperations.js'
import { getGlobalClaudeFile } from '../../utils/env.js'

const call: LocalCommandCall = async (args) => {
  const arg = args.trim()
  const config = getGlobalConfig()
  const companion = getCompanion()

  // 没有参数 - 显示当前完整信息
  if (!arg) {
    if (!companion) {
      return {
        type: 'text',
        value: 'No companion found yet. Use /buddy <rarity> [name] to create one!\n\nAvailable rarities: common, uncommon, rare, epic, legendary\nExamples: /buddy legendary, /buddy legendary 小可爱',
      }
    }

    const stars = RARITY_STARS[companion.rarity]
    const stored = config.companion

    return {
      type: 'text',
      value: `Your Buddy: ${companion.name}\n${stored?.customSeed ? `Custom Seed: ${stored.customSeed}\n` : ''}Species: ${companion.species}\nRarity: ${companion.rarity} ${stars}\nEye: ${companion.eye}\nHat: ${companion.hat}\nPersonality: ${companion.personality}\n${stored?.hatchedAt ? `Hatched at: ${new Date(stored.hatchedAt).toLocaleString()}\n` : ''}Shiny: ${companion.shiny ? '✨ Yes!' : 'No'}`,
    }
  }

  // 解析参数: /buddy <rarity> [name]
  const parts = arg.split(/\s+/)
  const firstArg = parts[0]?.toLowerCase()
  const nameArg = parts.slice(1).join(' ') || 'Buddy'

  // 检查是否是稀有度
  const rarity = firstArg as Rarity
  if (!RARITIES.includes(rarity)) {
    return {
      type: 'text',
      value: `Invalid rarity. Choose from: ${RARITIES.join(', ')}`,
    }
  }

  // 尝试不同的种子直到找到想要的稀有度
  let foundSeed: string | undefined
  let foundBones: ReturnType<typeof rollWithSeed> | undefined

  // 最多尝试 10000 次
  for (let i = 0; i < 10000; i++) {
    const seed = Date.now() + Math.random() * 1000000
    const result = rollWithSeed(seed.toString())

    if (result.bones.rarity === rarity) {
      foundSeed = seed.toString()
      foundBones = result
      break
    }
  }

  if (!foundSeed || !foundBones) {
    return {
      type: 'text',
      value: `Failed to generate a ${rarity} buddy after 10000 tries. Try again!`,
    }
  }

  // 更新配置文件
  const newCompanion = {
    name: nameArg || 'Buddy',
    personality: 'A faithful companion on your coding journey',
    hatchedAt: Date.now(),
    customSeed: foundSeed, // 使用自定义种子
  }

  const updatedConfig = {
    ...config,
    companion: newCompanion,
  }

  // 写入配置文件
  const configFile = getGlobalClaudeFile()
  writeFileSyncAndFlush_DEPRECATED(configFile, jsonStringify(updatedConfig, null, 2), {
    encoding: 'utf-8',
    mode: 0o600,
  })

  const stars = RARITY_STARS[rarity]
  const nameDisplay = nameArg ? `"${nameArg}"` : 'Buddy'

  return {
    type: 'text',
    value: `🎉 Found a ${rarity} ${stars} Buddy named ${nameDisplay}!\n\nSpecies: ${foundBones.bones.species}\nEye: ${foundBones.bones.eye} (symbol code: ${foundBones.bones.eye.codePointAt(0)})\nHat: ${foundBones.bones.hat}\nShiny: ${foundBones.bones.shiny ? '✨ Yes!' : 'No'}\nCustom Seed: ${foundSeed}\n\nRestart to see your new Buddy!`,
  }
}

const buddy = {
  type: 'local',
  name: 'buddy',
  description: 'Manage your Buddy companion. Usage: /buddy <rarity> [name]',
  supportsNonInteractive: true,
  load: () => Promise.resolve({ call }),
} satisfies Command

export default buddy
