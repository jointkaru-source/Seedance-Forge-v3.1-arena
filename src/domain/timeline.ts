import type { Frame } from '../types/project'

export type TimelineSegment = {
  frameId: string
  sceneId: string
  start: number
  end: number
  duration: number
  index: number
}

export function computeTimeline(frames: Frame[]): { segments: TimelineSegment[], totalDuration: number } {
  // sort by scene order? frames already have index; we need stable order: group by sceneId order then index
  // For simplicity sort by sceneId lexical then index, but store provides ordered scenes.
  // We'll just sort by index global? Instead assume frames are already in order as stored.
  // We'll compute by iterating frames sorted by sceneId+index for deterministic.
  const sorted = [...frames].sort((a,b)=>{
    if (a.sceneId !== b.sceneId) return a.sceneId.localeCompare(b.sceneId)
    return a.index - b.index
  })
  let t = 0
  const segments: TimelineSegment[] = sorted.map((f, i)=>{
    const dur = Math.max(0.5, f.duration || 2)
    const seg: TimelineSegment = { frameId: f.id, sceneId: f.sceneId, start: t, end: t+dur, duration: dur, index: i }
    t += dur
    return seg
  })
  return { segments, totalDuration: t }
}

export function frameAtTime(segments: TimelineSegment[], time: number): TimelineSegment | undefined {
  if (!segments.length) return undefined
  const clamped = Math.max(0, Math.min(time, segments[segments.length-1].end - 0.001))
  return segments.find(s=> clamped >= s.start && clamped < s.end) ?? segments[segments.length-1]
}

export function progressToTime(progress: number, total: number): number {
  return Math.max(0, Math.min(1, progress)) * total
}
