import type { Frame, Character, Environment, DepthCell, Platform, ShotType } from '../types/project'

export type PromptInput = {
  frame: Frame
  character?: Character
  environment?: Environment
  depthCell?: DepthCell
  aspectRatio: string
  platform: Platform
  visualStyle?: string
}

export function compilePrompt(input: PromptInput): string {
  const { frame, character, environment, depthCell, aspectRatio, platform, visualStyle } = input
  const shotLabel = shotTypeToPrompt(frame.shotType)
  const lens = frame.lens
  const movement = frame.movement
  const action = frame.action || 'cinematic still'

  const lockChar = character?.promptLock?.trim() || ''
  const lockEnv = environment?.promptLock?.trim() || ''

  // depth description
  let depthDesc = ''
  if (depthCell) {
    const parts = []
    if (depthCell.foreground) parts.push(`foreground: ${depthCell.foreground}`)
    if (depthCell.midground) parts.push(`midground: ${depthCell.midground}`)
    if (depthCell.background) parts.push(`background: ${depthCell.background}`)
    if (parts.length) depthDesc = parts.join(' | ')
  }

  const core = [
    `${shotLabel}, lens ${lens}, ${movement.toLowerCase()} camera.`,
    lockChar ? `\nCHARACTER LOCK: ${lockChar}` : '',
    lockEnv ? `\nENV LOCK: ${lockEnv}` : '',
    `\nAction: ${action}`,
    frame.dialogue ? `\nDialogue: "${frame.dialogue}"` : '',
    depthDesc ? `\nDepth: ${depthDesc}` : '',
    frame.visualNotes ? `\nNotes: ${frame.visualNotes}` : '',
    visualStyle ? `\nStyle: ${visualStyle}` : '',
  ].filter(Boolean).join('')

  // platform adapter
  switch(platform){
    case 'midjourney':
      return `${core.trim()} --ar ${aspectRatio} --style raw --v 6.0`
    case 'flux':
      return `${core.trim()}\nAspect ratio ${aspectRatio}, photorealistic, cinematic lighting, 8k`
    case 'seedance':
      return `/create video\n${core.trim()}\n--ar ${aspectRatio}\n--motion ${movement.toLowerCase()}\n--camera ${lens}`
    case 'runway':
      return `${core.trim()}\n[Runway Gen-3] ar:${aspectRatio} motion:5 camera:${movement}`
    case 'kling':
      return `${core.trim()} // Kling 2.1 --aspect ${aspectRatio} --creativity 0.7`
    case 'veo':
      return `${core.trim()}\nVeo prompt: cinematic, ${aspectRatio}, duration ${frame.duration}s`
    case 'generic':
    default:
      return `${core.trim()}\n--ar ${aspectRatio}`
  }
}

function shotTypeToPrompt(st: ShotType): string {
  const map: Record<ShotType,string> = {
    ELS: 'extreme long shot',
    LS: 'long shot',
    MLS: 'medium long shot',
    MS: 'medium shot',
    MCU: 'medium close-up',
    CU: 'close-up',
    ECU: 'extreme close-up',
    OTS: 'over-the-shoulder shot',
    POV: 'POV shot'
  }
  return map[st]
}

export function compileShotPromptFromState(frame: Frame, characters: Character[], envs: Environment[], depthCells: DepthCell[], aspectRatio: string, platform: Platform): string {
  const char = characters.find(c=>c.id===frame.characterId)
  const env = envs.find(e=>e.id===frame.environmentId)
  const depth = depthCells.find(d=>d.id===frame.depthCellId)
  return compilePrompt({ frame, character: char, environment: env, depthCell: depth, aspectRatio, platform })
}
