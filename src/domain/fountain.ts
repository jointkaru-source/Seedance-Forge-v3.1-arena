export type FountainToken =
  | { type:'scene_heading', text: string, raw: string }
  | { type:'action', text: string, raw: string }
  | { type:'character', text: string, raw: string }
  | { type:'dialogue', text: string, raw: string }
  | { type:'parenthetical', text: string, raw: string }
  | { type:'transition', text: string, raw: string }
  | { type:'blank', raw: string }
  | { type:'lyric', text: string, raw: string }

export type FountainParseResult = {
  tokens: FountainToken[]
  scenes: { heading: string, content: string[] }[]
  characters: string[]
  title?: string
  author?: string
}

const SCENE_RE = /^\s*(INT\.|EXT\.|INT\/EXT\.|I\/E\.)\s+.+/i
const TRANS_RE = /^\s*(CUT TO:|FADE IN:|FADE OUT\.|DISSOLVE TO:|SMASH CUT:|MATCH CUT:).*/i
const CHAR_RE = /^\s*[A-Z][A-Z0-9 \t'().-]*\s*(\(V\.O\.\)|\(O\.S\.\)|\(CONT'D\))?\s*$/
const PAREN_RE = /^\s*\(.*\)\s*$/
const LYRIC_RE = /^\s*~.+/

export function parseFountain(src: string): FountainParseResult {
  const lines = src.split(/\r?\n/)
  const tokens: FountainToken[] = []
  const scenes: { heading: string, content: string[] }[] = []
  let currentScene: { heading: string, content: string[] } | null = null
  const charSet = new Set<string>()
  let prevWasCharacter = false
  let prevWasParen = false

  let title: string | undefined
  let author: string | undefined
  let inTitleBlock = false

  for (let i=0;i<lines.length;i++) {
    const raw = lines[i]
    const trimmed = raw.trim()
    // title page detection first few lines with "Title:" etc
    if (i<20 && /^\s*Title\s*:/i.test(raw)) {
      title = raw.split(':').slice(1).join(':').trim()
      inTitleBlock = true
      continue
    }
    if (i<20 && /^\s*(Author|Written by|Credit|Draft date)\s*:/i.test(raw)) {
      const v = raw.split(':').slice(1).join(':').trim()
      if (/author|written/i.test(raw)) author = v
      continue
    }
    if (!trimmed) {
      tokens.push({type:'blank', raw})
      prevWasCharacter = false
      prevWasParen = false
      continue
    }
    if (inTitleBlock && i>3 && trimmed && !raw.startsWith(' ') && !raw.startsWith('\t')) {
      inTitleBlock = false
    }

    if (SCENE_RE.test(raw)) {
      const t: FountainToken = {type:'scene_heading', text: trimmed, raw}
      tokens.push(t)
      if (currentScene) scenes.push(currentScene)
      currentScene = { heading: trimmed, content: [] }
      prevWasCharacter = false
      prevWasParen = false
      continue
    }
    if (TRANS_RE.test(trimmed) && trimmed === trimmed.toUpperCase()) {
      tokens.push({type:'transition', text: trimmed, raw})
      prevWasCharacter = false
      prevWasParen = false
      continue
    }
    if (LYRIC_RE.test(raw)) {
      tokens.push({type:'lyric', text: trimmed.slice(1).trim(), raw})
      prevWasCharacter = false
      prevWasParen = false
      continue
    }
    if (PAREN_RE.test(raw) && (prevWasCharacter || prevWasParen)) {
      tokens.push({type:'parenthetical', text: trimmed, raw})
      prevWasParen = true
      // still considered part of dialogue context
      continue
    }
    // Character cue: uppercase, not too long, no lowercase, preceded by blank or scene/action
    if (CHAR_RE.test(raw) && trimmed.length < 40 && trimmed === trimmed.toUpperCase() && !SCENE_RE.test(raw) && !TRANS_RE.test(trimmed)) {
      // heuristic: avoid action lines that are uppercase but long
      const wordCount = trimmed.split(/\s+/).length
      if (wordCount <= 4) {
        const name = trimmed.replace(/\s*\(.*\)\s*$/, '').trim()
        tokens.push({type:'character', text: name, raw})
        charSet.add(name)
        prevWasCharacter = true
        prevWasParen = false
        if (currentScene) currentScene.content.push(raw)
        continue
      }
    }
    if (prevWasCharacter || prevWasParen) {
      // dialogue line
      tokens.push({type:'dialogue', text: trimmed, raw})
      // keep prevWasCharacter true for multi-line dialogue until blank
      // but reset paren flag
      prevWasParen = false
      if (currentScene) currentScene.content.push(raw)
      continue
    }
    // otherwise action
    tokens.push({type:'action', text: raw.trim(), raw})
    if (currentScene) currentScene.content.push(raw)
    prevWasCharacter = false
    prevWasParen = false
  }
  if (currentScene) scenes.push(currentScene)

  return { tokens, scenes, characters: Array.from(charSet), title, author }
}

export function fountainPreviewHtml(result: FountainParseResult): string {
  return result.tokens.map(t=>{
    switch(t.type){
      case 'scene_heading': return `<div style="font-weight:700; margin:1.2em 0 0.5em; text-transform:uppercase; letter-spacing:0.06em; font-size:0.95em; color:#e4e4e7;">${escapeHtml(t.text)}</div>`
      case 'character': return `<div style="text-align:center; font-weight:600; margin:0.9em 0 0.1em; letter-spacing:0.08em; font-size:0.9em; color:#fafafa;">${escapeHtml(t.text)}</div>`
      case 'dialogue': return `<div style="max-width:28em; margin:0 auto; text-align:left; padding:0 2em; color:#d4d4d8; line-height:1.5;">${escapeHtml(t.text)}</div>`
      case 'parenthetical': return `<div style="text-align:center; font-style:italic; color:#a1a1aa; margin:0.1em 0;">${escapeHtml(t.text)}</div>`
      case 'transition': return `<div style="text-align:right; font-weight:500; margin:0.8em 0; color:#a1a1aa; text-transform:uppercase; letter-spacing:0.08em;">${escapeHtml(t.text)}</div>`
      case 'action': return `<div style="margin:0.6em 0; color:#d4d4d8; line-height:1.6; font-size:0.92em;">${escapeHtml(t.text)}</div>`
      case 'blank': return `<div style="height:0.6em;"></div>`
      case 'lyric': return `<div style="font-style:italic; color:#71717a; text-align:center; margin:0.4em 0;">~ ${escapeHtml(t.text)}</div>`
    }
  }).join('')
}

function escapeHtml(s: string){
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}
