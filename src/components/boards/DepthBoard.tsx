import { useStore } from '../../store/useStore'

const SHOTS = [
  {id:'ELS', label:'ELS', desc:'Extreme Long'},
  {id:'LS', label:'LS', desc:'Long'},
  {id:'MLS', label:'MLS', desc:'Medium Long'},
  {id:'MS', label:'MS', desc:'Medium'},
  {id:'MCU', label:'MCU', desc:'Med Close-Up'},
  {id:'CU', label:'CU', desc:'Close-Up'},
  {id:'ECU', label:'ECU', desc:'Extreme CU'},
  {id:'OTS', label:'OTS', desc:'Over Shoulder'},
  {id:'POV', label:'POV', desc:'Point of View'},
]

export function DepthBoard(){
  const project = useStore(s=>s.project)
  const updateDepthCell = useStore(s=>s.updateDepthCell)
  const selectedFrameId = useStore(s=>s.selection.selectedFrameId)
  const selectedFrame = project.frames.find(f=>f.id===selectedFrameId)
  const selectedCellId = selectedFrame?.depthCellId

  return (
    <div className="p-3 space-y-3">
      <div className="text-[10px] font-mono tracking-widest text-white/40">3×3 COMPOSITION • CLICK TO ASSIGN TO SELECTED SHOT {selectedFrame ? `(${selectedFrame.shotType} → ${selectedCellId ?? 'none'})` : '(no selection)'}</div>
      <div className="grid grid-cols-3 gap-2">
        {SHOTS.map(s=>{
          const cell = project.depthCells.find(d=>d.id===s.id)
          const isActive = selectedCellId===s.id
          return (
            <div key={s.id} onClick={()=>{
              if(!selectedFrame) return
              useStore.getState().updateFrame(selectedFrame.id,{depthCellId:s.id})
            }} className={`rounded-xl border p-2.5 cursor-pointer transition flex flex-col gap-1.5 ${isActive?'bg-amber-500 border-amber-500 text-black':'bg-white/[0.04] border-white/10 hover:bg-white/10 text-zinc-100'}`}>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[11px] font-bold tracking-widest">{s.label}</span>
                <span className={`text-[9px] font-mono px-1 py-0.5 rounded ${isActive?'bg-black text-amber-400':'bg-white/10 text-white/60'}`}>{s.desc}</span>
              </div>
              <div className="space-y-1">
                <input value={cell?.foreground ?? ''} onClick={e=>e.stopPropagation()} onChange={e=>updateDepthCell(s.id,{foreground:e.target.value})} placeholder="FG" className={`w-full rounded-lg px-2 py-1 text-[11px] border focus:outline-none ${isActive?'bg-black/10 border-black/20 placeholder:text-black/40 text-black':'bg-black/30 border-white/10 text-white placeholder:text-white/30'}`} />
                <input value={cell?.midground ?? ''} onClick={e=>e.stopPropagation()} onChange={e=>updateDepthCell(s.id,{midground:e.target.value})} placeholder="MG" className={`w-full rounded-lg px-2 py-1 text-[11px] border focus:outline-none ${isActive?'bg-black/10 border-black/20 placeholder:text-black/40 text-black':'bg-black/30 border-white/10 text-white placeholder:text-white/30'}`} />
                <input value={cell?.background ?? ''} onClick={e=>e.stopPropagation()} onChange={e=>updateDepthCell(s.id,{background:e.target.value})} placeholder="BG" className={`w-full rounded-lg px-2 py-1 text-[11px] border focus:outline-none ${isActive?'bg-black/10 border-black/20 placeholder:text-black/40 text-black':'bg-black/30 border-white/10 text-white placeholder:text-white/30'}`} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl bg-black/20 border border-white/10 p-3">
        <div className="text-[10px] font-mono tracking-widest text-white/40 mb-2">CAMERA PRESETS FOR SELECTED SHOT</div>
        {selectedFrame ? (
          <div className="grid grid-cols-3 gap-2">
            <select value={selectedFrame.lens} onChange={e=>useStore.getState().updateFrame(selectedFrame.id,{lens:e.target.value as any})} className="bg-zinc-900 border border-white/10 rounded-xl px-2 py-2 text-xs font-mono">
              {['16mm','24mm','35mm','50mm','85mm','135mm'].map(l=> <option key={l} value={l}>{l}</option>)}
            </select>
            <select value={selectedFrame.movement} onChange={e=>useStore.getState().updateFrame(selectedFrame.id,{movement:e.target.value as any})} className="bg-zinc-900 border border-white/10 rounded-xl px-2 py-2 text-xs">
              {['Static','Pan','Tilt','Dolly','Tracking','Orbital','Crane','Handheld'].map(m=> <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={selectedFrame.shotType} onChange={e=>useStore.getState().updateFrame(selectedFrame.id,{shotType:e.target.value as any})} className="bg-zinc-900 border border-white/10 rounded-xl px-2 py-2 text-xs font-mono">
              {SHOTS.map(s=> <option key={s.id} value={s.id}>{s.id}</option>)}
            </select>
          </div>
        ): <div className="text-xs text-zinc-500">Selecione um frame.</div>}
      </div>
    </div>
  )
}
