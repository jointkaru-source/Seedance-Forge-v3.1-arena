import { useStore } from '../store/useStore'
import { SHOT_TYPES, LENSES, MOVEMENTS } from '../types/project'

export function InspectorPanel(){
  const project = useStore(s=>s.project)
  const selection = useStore(s=>s.selection)
  const ui = useStore(s=>s.ui)
  const setUI = useStore(s=>s.setUI)
  const updateFrame = useStore(s=>s.updateFrame)
  const frame = project.frames.find(f=>f.id===selection.selectedFrameId)

  if (!frame) {
    return (
      <div className="w-[320px] shrink-0 glass-strong flex flex-col no-print border-l border-white/10">
        <div className="h-11 flex items-center px-4 border-b border-white/10">
          <span className="font-mono text-[11px] tracking-[0.14em] font-semibold">INSPECTOR</span>
          <span className="ml-auto text-[10px] font-mono text-white/30">NO SELECTION</span>
        </div>
        <div className="p-6 text-sm text-zinc-400">Selecione um frame no Storyboard para inspecionar.</div>
      </div>
    )
  }

  const char = project.characters.find(c=>c.id===frame.characterId)
  const env = project.environments.find(e=>e.id===frame.environmentId)

  return (
    <div className="w-[340px] shrink-0 glass-strong flex flex-col border-l border-white/[0.08] no-print h-full">
      <div className="h-11 flex items-center px-3 border-b border-white/10 shrink-0">
        <span className="font-mono text-[11px] tracking-[0.14em] font-semibold">INSPECTOR</span>
        <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500 text-black font-bold">{frame.shotType}</span>
        <span className="ml-auto font-mono text-[10px] text-white/40">{frame.id.slice(-6).toUpperCase()}</span>
      </div>

      <div className="flex gap-1 p-1 bg-black/30 border-b border-white/5">
        {(['frame','camera','locks'] as const).map(tab=>(
          <button key={tab} onClick={()=>setUI({inspectorTab:tab})} className={`flex-1 h-7 rounded-full text-[11px] font-mono tracking-widest font-semibold transition ${ui.inspectorTab===tab?'bg-white text-black':'text-white/50 hover:text-white hover:bg-white/10'}`}>{tab.toUpperCase()}</button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-5">
        {ui.inspectorTab==='frame' && (
          <>
            <Field label="ACTION">
              <textarea value={frame.action} onChange={e=>updateFrame(frame.id,{action:e.target.value})} rows={3} className="w-full bg-white/[0.06] border border-white/10 rounded-xl p-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/50" placeholder="Descreva a ação..." />
            </Field>
            <Field label="DIALOGUE / V.O.">
              <textarea value={frame.dialogue??''} onChange={e=>updateFrame(frame.id,{dialogue:e.target.value})} rows={2} className="w-full bg-white/[0.06] border border-white/10 rounded-xl p-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/50" placeholder="Diálogo opcional" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="DURATION (s)">
                <input type="number" step="0.5" min={0.5} max={30} value={frame.duration} onChange={e=>updateFrame(frame.id,{duration: parseFloat(e.target.value)||0})} className="w-full bg-white/[0.06] border border-white/10 rounded-xl p-2.5 text-sm font-mono" />
              </Field>
              <Field label="SCENE">
                <select value={frame.sceneId} onChange={e=>useStore.getState().moveFrameToScene(frame.id, e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-xl p-2.5 text-xs">
                  {project.scenes.map(s=> <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </Field>
            </div>
            <Field label="VISUAL NOTES">
              <textarea value={frame.visualNotes??''} onChange={e=>updateFrame(frame.id,{visualNotes:e.target.value})} rows={2} className="w-full bg-white/[0.06] border border-white/10 rounded-xl p-3 text-sm" placeholder="Notas visuais, lentes, referência..." />
            </Field>
            {char && <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3"><div className="text-[10px] font-mono tracking-widest text-amber-300">CHARACTER LOCK</div><div className="text-xs text-amber-100/90 mt-1 line-clamp-3">{char.promptLock || '— missing —'}</div></div>}
            {env && <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3"><div className="text-[10px] font-mono tracking-widest text-emerald-300">ENV LOCK</div><div className="text-xs text-emerald-100/90 mt-1 line-clamp-3">{env.promptLock || '— missing —'}</div></div>}
          </>
        )}

        {ui.inspectorTab==='camera' && (
          <>
            <Field label="SHOT TYPE">
              <div className="grid grid-cols-3 gap-1.5">
                {SHOT_TYPES.map(st=>(
                  <button key={st} onClick={()=>updateFrame(frame.id,{shotType:st})} className={`h-9 rounded-xl border text-[11px] font-mono font-semibold tracking-widest ${frame.shotType===st?'bg-amber-500 text-black border-amber-500':'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'}`}>{st}</button>
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="LENS">
                <select value={frame.lens} onChange={e=>updateFrame(frame.id,{lens:e.target.value as any})} className="w-full bg-zinc-900 border border-white/10 rounded-xl p-2.5 text-sm font-mono">
                  {LENSES.map(l=> <option key={l} value={l}>{l}</option>)}
                </select>
              </Field>
              <Field label="MOVEMENT">
                <select value={frame.movement} onChange={e=>updateFrame(frame.id,{movement:e.target.value as any})} className="w-full bg-zinc-900 border border-white/10 rounded-xl p-2.5 text-sm">
                  {MOVEMENTS.map(m=> <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
            </div>
            <Field label="DEPTH CELL">
              <select value={frame.depthCellId ?? ''} onChange={e=>updateFrame(frame.id,{depthCellId:e.target.value || undefined})} className="w-full bg-zinc-900 border border-white/10 rounded-xl p-2.5 text-sm">
                <option value="">— none —</option>
                {project.depthCells.map(d=> <option key={d.id} value={d.id}>{d.shotType} — FG/MG/BG</option>)}
              </select>
            </Field>
          </>
        )}

        {ui.inspectorTab==='locks' && (
          <>
            <Field label="CHARACTER">
              <select value={frame.characterId ?? ''} onChange={e=>updateFrame(frame.id,{characterId:e.target.value || undefined})} className="w-full bg-zinc-900 border border-white/10 rounded-xl p-2.5 text-sm">
                <option value="">— none —</option>
                {project.characters.map(c=> <option key={c.id} value={c.id}>{c.name} {c.lockStatus==='locked'?'●':''}</option>)}
              </select>
            </Field>
            <Field label="ENVIRONMENT">
              <select value={frame.environmentId ?? ''} onChange={e=>updateFrame(frame.id,{environmentId:e.target.value || undefined})} className="w-full bg-zinc-900 border border-white/10 rounded-xl p-2.5 text-sm">
                <option value="">— none —</option>
                {project.environments.map(en=> <option key={en.id} value={en.id}>{en.name} {en.lockStatus==='locked'?'●':''}</option>)}
              </select>
            </Field>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-2">
              <div className="text-[11px] font-mono tracking-widest text-white/60">CONTINUITY</div>
              <div className="text-xs leading-relaxed text-zinc-400">Locks aprovados são fonte canônica. Shots herdam identidade visual e ambiente. Prompt Studio compila a partir desses dados estruturados.</div>
              <div className="flex gap-2 pt-2">
                <span className={`text-[10px] font-mono px-2 py-1 rounded-full border ${char?.lockStatus==='locked'?'bg-emerald-500/15 border-emerald-500/30 text-emerald-300':'bg-white/5 border-white/10 text-white/40'}`}>CHAR: {char?.lockStatus ?? 'none'}</span>
                <span className={`text-[10px] font-mono px-2 py-1 rounded-full border ${env?.lockStatus==='locked'?'bg-emerald-500/15 border-emerald-500/30 text-emerald-300':'bg-white/5 border-white/10 text-white/40'}`}>ENV: {env?.lockStatus ?? 'none'}</span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="p-3 border-t border-white/10 flex gap-2">
        <button onClick={()=>{ if(confirm('Deletar frame?')) useStore.getState().deleteFrame(frame.id)}} className="flex-1 h-9 rounded-full bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-300 text-xs font-mono tracking-widest">DELETE</button>
        <button onClick={()=>useStore.getState().toast('Frame duplicado','success')} className="flex-1 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-mono tracking-widest">DUPLICATE</button>
      </div>
    </div>
  )
}

function Field({label, children}:{label:string, children:React.ReactNode}){
  return <div><div className="text-[10px] font-mono tracking-[0.14em] text-white/40 mb-1.5">{label}</div>{children}</div>
}
