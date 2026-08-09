import { useStore } from '../../store/useStore'
import { VisualFrame } from '../VisualFrame'

export function BibleModal(){
  const show = useStore(s=>s.ui.showBible)
  const setUI = useStore(s=>s.setUI)
  const project = useStore(s=>s.project)
  if(!show) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={()=>setUI({showBible:false})} />
      <div className="relative ml-auto w-full max-w-[980px] h-full bg-[#0f0f11] border-l border-white/10 flex flex-col overflow-hidden">
        <div className="h-14 flex items-center px-6 border-b border-white/10 shrink-0 bg-gradient-to-r from-violet-950/40 to-transparent">
          <div>
            <div className="font-display font-bold tracking-widest text-sm">VISUAL PRODUCTION BIBLE</div>
            <div className="font-mono text-[11px] tracking-widest text-white/40">{project.title} • {project.director} • {project.aspectRatio} • v{project.schemaVersion}</div>
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={()=>window.print()} className="h-8 px-3 rounded-full bg-white text-black text-xs font-bold">PRINT / PDF</button>
            <button onClick={()=>setUI({showBible:false})} className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">×</button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-8 print:p-0">
          {/* cover */}
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-6">
            <div className="text-[11px] font-mono tracking-[0.2em] text-amber-400">SEEDANCE FORGE v3.1</div>
            <div className="text-3xl font-display font-bold tracking-tight mt-1">{project.title}</div>
            <div className="text-sm text-zinc-400 mt-1">Directed by {project.director || '—'} • {project.fps} FPS • {project.aspectRatio}</div>
            {project.briefing && <div className="mt-3 text-sm leading-relaxed text-zinc-300 max-w-[70ch]">{project.briefing}</div>}
            <div className="mt-4 flex gap-2 text-[11px] font-mono">
              <span className="px-2.5 py-1 rounded-full bg-white text-black font-bold">{project.scenes.length} SCENES</span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/10">{project.frames.length} SHOTS</span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/10">{project.characters.length} CHARACTERS</span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/10">{project.environments.length} ENVIRONMENTS</span>
            </div>
          </div>

          {/* characters */}
          <section>
            <h2 className="font-mono text-xs tracking-[0.18em] font-bold border-b border-white/10 pb-2">01 — CHARACTERS & LOCKS</h2>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {project.characters.map(c=>(
                <div key={c.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center font-bold text-white">{c.name.slice(0,2)}</div>
                    <div>
                      <div className="font-mono text-xs font-bold tracking-widest">{c.name}</div>
                      <div className="text-xs text-zinc-400">{c.role} • {c.age}</div>
                    </div>
                    <span className={`ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${c.lockStatus==='locked'?'bg-emerald-500 text-black border-emerald-500':'bg-zinc-800 border-zinc-700 text-zinc-300'}`}>{c.lockStatus}</span>
                  </div>
                  <div className="flex gap-1 mt-3">
                    {c.palette.map((col,i)=> <span key={i} className="w-6 h-6 rounded-full border border-white/10" style={{background:col}} title={col} />)}
                  </div>
                  <div className="mt-3 space-y-1 text-xs leading-relaxed">
                    <div><span className="text-white/40 font-mono text-[10px] tracking-widest">WARDROBE:</span> {c.wardrobe || '—'}</div>
                    <div><span className="text-white/40 font-mono text-[10px] tracking-widest">PHYSICAL:</span> {c.physicalDescription || '—'}</div>
                  </div>
                  {c.promptLock && <div className="mt-3 rounded-xl bg-black/30 border border-violet-500/20 p-3 text-[11px] leading-relaxed font-mono">{c.promptLock}</div>}
                </div>
              ))}
            </div>
          </section>

          {/* environments */}
          <section>
            <h2 className="font-mono text-xs tracking-[0.18em] font-bold border-b border-white/10 pb-2">02 — ENVIRONMENTS & SOAC LOCKS</h2>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {project.environments.map(e=>(
                <div key={e.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">⬢</span>
                    <div className="font-mono text-xs font-bold tracking-widest">{e.name}</div>
                    <span className={`ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${e.lockStatus==='locked'?'bg-emerald-500 text-black border-emerald-500':'bg-zinc-800 border-zinc-700 text-zinc-300'}`}>{e.lockStatus}</span>
                  </div>
                  <div className="flex gap-1 mt-3">
                    {e.palette.map((col,i)=> <span key={i} className="w-6 h-6 rounded-full border border-white/10" style={{background:col}} />)}
                  </div>
                  <div className="mt-2 text-xs leading-relaxed space-y-1">
                    <div><span className="text-white/40 font-mono text-[10px]">ARCH:</span> {e.architecture || '—'}</div>
                    <div><span className="text-white/40 font-mono text-[10px]">LIGHT:</span> {e.lighting || '—'}</div>
                    <div><span className="text-white/40 font-mono text-[10px]">ATMO:</span> {e.atmosphere || '—'}</div>
                  </div>
                  {e.promptLock && <div className="mt-3 rounded-xl bg-black/30 border border-emerald-500/20 p-3 text-[11px] leading-relaxed font-mono">{e.promptLock}</div>}
                </div>
              ))}
            </div>
          </section>

          {/* shot inventory */}
          <section>
            <h2 className="font-mono text-xs tracking-[0.18em] font-bold border-b border-white/10 pb-2">03 — SHOT INVENTORY ({project.frames.length})</h2>
            <div className="mt-4 grid gap-3">
              {project.scenes.map(scene=>{
                const frames = project.frames.filter(f=>f.sceneId===scene.id).sort((a,b)=>a.index-b.index)
                return (
                  <div key={scene.id} className="rounded-xl border border-white/10 overflow-hidden">
                    <div className="bg-white/[0.04] px-4 py-2 border-b border-white/10 flex items-center gap-2">
                      <span className="font-mono text-xs font-bold tracking-widest">{scene.title}</span>
                      <span className="text-[10px] font-mono bg-white text-black px-2 py-0.5 rounded-full font-bold">{frames.length} SHOTS</span>
                    </div>
                    <div className="divide-y divide-white/5">
                      {frames.map(f=>(
                        <div key={f.id} className="p-3 flex gap-3">
                          <div className="w-[180px] shrink-0"><VisualFrame shotType={f.shotType} aspectRatio={project.aspectRatio} palette={project.characters.find(c=>c.id===f.characterId)?.palette} letterbox={false} /></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500 text-black font-bold">{f.shotType}</span>
                              <span className="text-[11px] font-mono text-white/60">{f.lens} • {f.movement} • {f.duration}s</span>
                              <span className="ml-auto text-[10px] font-mono text-white/30">{f.id.slice(-6)}</span>
                            </div>
                            <div className="text-xs leading-relaxed mt-1">{f.action}</div>
                            {f.dialogue && <div className="text-xs italic text-amber-200 mt-1">“{f.dialogue}”</div>}
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {f.characterId && <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 border border-white/10">{project.characters.find(c=>c.id===f.characterId)?.name}</span>}
                              {f.environmentId && <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 border border-white/10">{project.environments.find(e=>e.id===f.environmentId)?.name}</span>}
                            </div>
                            {f.prompt && <div className="mt-2 text-[11px] font-mono leading-relaxed bg-black/30 border border-white/5 rounded-lg p-2">{f.prompt.slice(0,280)}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <div className="text-center text-[11px] font-mono tracking-widest text-white/20 pt-6 border-t border-white/5">GENERATED FROM CANONICAL PROJECT STATE • SEEDANCE FORGE v3.1 • {new Date().toLocaleDateString()}</div>
        </div>
      </div>
    </div>
  )
}
