import { useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import { computeTimeline, frameAtTime } from '../domain/timeline'

export function TimelineBar(){
  const project = useStore(s=>s.project)
  const playback = useStore(s=>s.playback)
  const selection = useStore(s=>s.selection)
  const setPlayback = useStore(s=>s.setPlayback)
  const selectFrame = useStore(s=>s.selectFrame)
  const { segments, totalDuration } = computeTimeline(project.frames)
  const active = frameAtTime(segments, playback.currentTime)
  const barRef = useRef<HTMLDivElement>(null)

  // raf playback
  useEffect(()=>{
    if (!playback.isPlaying) return
    let raf = 0
    let last = performance.now()
    const tick = (now:number)=>{
      const dt = (now - last)/1000
      last = now
      const next = playback.currentTime + dt
      if (next >= totalDuration){
        setPlayback({ currentTime: totalDuration, isPlaying:false })
        return
      }
      setPlayback({ currentTime: next })
      // update selection to active frame
      const seg = frameAtTime(segments, next)
      if (seg && seg.frameId !== selection.selectedFrameId){
        // don't spam selection? but keep in sync
        // selectFrame(seg.frameId) // optional - we will do softly
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return ()=> cancelAnimationFrame(raf)
  }, [playback.isPlaying, playback.currentTime, totalDuration, segments])

  const seek = (clientX:number)=>{
    if (!barRef.current || totalDuration===0) return
    const rect = barRef.current.getBoundingClientRect()
    const p = (clientX - rect.left)/rect.width
    setPlayback({ currentTime: Math.max(0, Math.min(1,p))* totalDuration })
  }

  const onBarClick = (e: React.MouseEvent)=>{
    seek(e.clientX)
    const p = (e.clientX - (barRef.current?.getBoundingClientRect().left ?? 0)) / (barRef.current?.offsetWidth ?? 1)
    const t = p * totalDuration
    const seg = frameAtTime(segments, t)
    if (seg) selectFrame(seg.frameId)
  }

  return (
    <div className="h-[92px] shrink-0 glass-strong border-t border-white/10 flex flex-col no-print">
      <div className="h-9 flex items-center px-4 gap-3 border-b border-white/5">
        <div className="flex items-center gap-1.5">
          <button onClick={()=> setPlayback({isPlaying: !playback.isPlaying})} className={`w-8 h-8 rounded-full flex items-center justify-center border transition ${playback.isPlaying?'bg-amber-500 border-amber-500 text-black':'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}>
            <span className="text-[14px]">{playback.isPlaying?'❚❚':'▶'}</span>
          </button>
          <button onClick={()=> setPlayback({currentTime:0, isPlaying:false})} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10">■</button>
          <button onClick={()=> setPlayback({currentTime: Math.max(0, playback.currentTime-1)})} className="hidden sm:flex w-8 h-8 rounded-full bg-white/5 border border-white/10 items-center justify-center text-white hover:bg-white/10">‹‹</button>
          <button onClick={()=> setPlayback({currentTime: Math.min(totalDuration, playback.currentTime+1)})} className="hidden sm:flex w-8 h-8 rounded-full bg-white/5 border border-white/10 items-center justify-center text-white hover:bg-white/10">››</button>
        </div>

        <div className="h-6 w-px bg-white/10 mx-1" />

        <div className="font-mono text-xs tracking-widest text-white flex items-center gap-2">
          <span className="text-white/50">TIME</span>
          <span className="bg-white text-black px-2 py-0.5 rounded-full font-bold">{playback.currentTime.toFixed(1)}s</span>
          <span className="text-white/30">/</span>
          <span className="text-white/70">{totalDuration.toFixed(1)}s</span>
        </div>

        <div className="ml-auto hidden md:flex items-center gap-2">
          <span className="text-[10px] font-mono tracking-widest text-white/30">{project.frames.length} SHOTS • {project.scenes.length} SCENES • {project.fps} FPS</span>
          <div className="w-px h-4 bg-white/10" />
          <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-amber-500 text-black font-bold">{active ? project.frames.find(f=>f.id===active.frameId)?.shotType : '—'}</span>
        </div>
      </div>

      <div className="flex-1 p-2 px-3 flex flex-col justify-center">
        <div ref={barRef} onClick={onBarClick} className="relative h-[42px] bg-black/40 rounded-xl border border-white/10 overflow-hidden cursor-pointer group">
          {/* segments */}
          <div className="absolute inset-1 flex gap-[2px]">
            {segments.map(seg=>{
              const frame = project.frames.find(f=>f.id===seg.frameId)
              const isActive = active?.frameId===seg.frameId
              const isSelected = selection.selectedFrameId===seg.frameId
              const wPct = (seg.duration/totalDuration)*100
              return (
                <div
                  key={seg.frameId}
                  onClick={(e)=>{ e.stopPropagation(); selectFrame(seg.frameId); setPlayback({currentTime: seg.start + 0.01})}}
                  className={`relative rounded-[8px] overflow-hidden border flex flex-col justify-center px-2 cursor-pointer transition-all ${isSelected?'border-amber-500 bg-amber-500 text-black': isActive?'border-white/20 bg-white/10 text-white':'bg-zinc-800 border-white/5 text-zinc-300 hover:bg-zinc-700'}`}
                  style={{ width: `${wPct}%`, minWidth: 56 }}
                >
                  <div className="text-[10px] font-mono tracking-widest leading-none opacity-80">{frame?.shotType} • {frame?.lens}</div>
                  <div className="text-[11px] font-semibold leading-none truncate">{project.scenes.find(s=>s.id===frame?.sceneId)?.title.split(' ').slice(0,3).join(' ')}</div>
                  <div className="text-[10px] font-mono opacity-60">{seg.duration.toFixed(1)}s</div>
                </div>
              )
            })}
          </div>
          {/* playhead */}
          <div className="absolute top-0 bottom-0 w-[2px] bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.8)] pointer-events-none" style={{ left: `${(playback.currentTime/totalDuration)*100}%`}}>
            <div className="absolute -top-1 -left-1.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-black" />
          </div>
        </div>
      </div>
    </div>
  )
}
