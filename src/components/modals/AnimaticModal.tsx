import { useEffect, useState } from 'react'
import { useStore } from '../../store/useStore'
import { computeTimeline, frameAtTime } from '../../domain/timeline'
import { VisualFrame } from '../VisualFrame'

export function AnimaticModal(){
  const show = useStore(s=>s.ui.showAnimatic)
  const setUI = useStore(s=>s.setUI)
  const project = useStore(s=>s.project)
  const playback = useStore(s=>s.playback)
  const setPlayback = useStore(s=>s.setPlayback)
  const { segments, totalDuration } = computeTimeline(project.frames)
  const [localTime, setLocalTime] = useState(playback.currentTime)

  useEffect(()=>{ setLocalTime(playback.currentTime)}, [playback.currentTime])

  useEffect(()=>{
    if(!show) return
    const onKey = (e:KeyboardEvent)=>{ if(e.key==='Escape') setUI({showAnimatic:false})}
    window.addEventListener('keydown', onKey)
    return ()=> window.removeEventListener('keydown', onKey)
  }, [show])

  useEffect(()=>{
    if(!show || !playback.isPlaying) return
    let raf=0
    let last=performance.now()
    const tick=(now:number)=>{
      const dt=(now-last)/1000
      last=now
      const next= localTime + dt
      if(next>=totalDuration){ setPlayback({isPlaying:false, currentTime:totalDuration}); setLocalTime(totalDuration); return }
      setLocalTime(next)
      setPlayback({currentTime: next})
      raf=requestAnimationFrame(tick)
    }
    raf=requestAnimationFrame(tick)
    return ()=>cancelAnimationFrame(raf)
  }, [show, playback.isPlaying, localTime, totalDuration])

  if(!show) return null
  const activeSeg = frameAtTime(segments, localTime)
  const activeFrame = project.frames.find(f=>f.id===activeSeg?.frameId)
  const progress = totalDuration? (localTime/totalDuration)*100 : 0

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="h-12 flex items-center px-4 border-b border-white/10 bg-zinc-900">
        <span className="font-mono text-xs tracking-[0.18em] font-bold">ANIMATIC</span>
        <span className="ml-3 text-xs font-mono bg-white text-black px-2 py-0.5 rounded-full font-bold">{project.title}</span>
        <span className="ml-auto text-xs font-mono text-white/50">{localTime.toFixed(1)}s / {totalDuration.toFixed(1)}s</span>
        <button onClick={()=>setUI({showAnimatic:false})} className="ml-3 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center">×</button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4 overflow-auto bg-gradient-to-b from-zinc-900 to-black">
        {activeFrame ? (
          <>
            <div className="w-full max-w-[960px]">
              <VisualFrame shotType={activeFrame.shotType} aspectRatio={project.aspectRatio} palette={project.characters.find(c=>c.id===activeFrame.characterId)?.palette} />
            </div>
            <div className="w-full max-w-[960px] rounded-xl border border-white/10 bg-white/5 backdrop-blur p-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-1 rounded-full bg-amber-500 text-black font-bold">{activeFrame.shotType}</span>
                <span className="text-xs font-mono text-white/60">{activeFrame.lens} • {activeFrame.movement} • {activeFrame.duration}s</span>
                <span className="ml-auto text-xs font-mono text-white/40">{project.scenes.find(s=>s.id===activeFrame.sceneId)?.title}</span>
              </div>
              <div className="mt-2 text-sm leading-relaxed text-white">{activeFrame.action}</div>
              {activeFrame.dialogue && <div className="mt-2 text-center text-sm italic text-amber-200">“{activeFrame.dialogue}”</div>}
              <div className="mt-2 text-[11px] font-mono text-white/30">FRAME {segments.findIndex(s=>s.frameId===activeFrame.id)+1} / {segments.length} • {activeSeg?.start.toFixed(1)}s → {activeSeg?.end.toFixed(1)}s</div>
            </div>
          </>
        ): <div className="text-zinc-500">Sem frames</div>}
      </div>

      <div className="h-[88px] border-t border-white/10 bg-zinc-900 p-3 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <button onClick={()=>setPlayback({isPlaying:!playback.isPlaying})} className={`h-8 px-4 rounded-full font-bold text-xs tracking-widest ${playback.isPlaying?'bg-amber-500 text-black':'bg-white text-black'}`}>{playback.isPlaying?'PAUSE':'PLAY'}</button>
          <button onClick={()=>{ setLocalTime(0); setPlayback({currentTime:0, isPlaying:false})}} className="h-8 px-3 rounded-full bg-white/10 border border-white/10 text-white text-xs font-mono">STOP</button>
          <div className="ml-auto flex items-center gap-2">
            {segments.map(s=>{
              const isActive = s.frameId===activeFrame?.id
              return <div key={s.frameId} className={`w-2 h-2 rounded-full ${isActive?'bg-amber-400':'bg-white/15'}`} />
            })}
          </div>
        </div>
        <div className="relative h-2 bg-black/40 rounded-full overflow-hidden border border-white/10 cursor-pointer" onClick={e=>{
          const rect=(e.currentTarget as HTMLDivElement).getBoundingClientRect()
          const p=(e.clientX-rect.left)/rect.width
          const t=p*totalDuration
          setLocalTime(t); setPlayback({currentTime:t})
        }}>
          <div className="absolute inset-y-0 left-0 bg-amber-500" style={{width:`${progress}%`}} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-amber-500" style={{left:`calc(${progress}% - 6px)`}} />
        </div>
      </div>
    </div>
  )
}
