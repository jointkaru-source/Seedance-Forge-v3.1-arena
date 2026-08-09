import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { VisualFrame } from '../VisualFrame'
import { SHOT_TYPES } from '../../types/project'

export function StoryboardBoard(){
  const project = useStore(s=>s.project)
  const selection = useStore(s=>s.selection)
  const selectFrame = useStore(s=>s.selectFrame)
  const addFrame = useStore(s=>s.addFrame)
  const addScene = useStore(s=>s.addScene)
  const updateScene = useStore(s=>s.updateScene)
  const deleteScene = useStore(s=>s.deleteScene)
  const updateFrame = useStore(s=>s.updateFrame)
  const deleteFrame = useStore(s=>s.deleteFrame)
  const reorderFrames = useStore(s=>s.reorderFrames)
  const [dragId, setDragId] = useState<string|null>(null)

  return (
    <div className="p-3 space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={addScene} className="h-8 px-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono tracking-widest">+ SCENE</button>
        <span className="text-[10px] font-mono tracking-widest text-white/30 ml-auto">{project.frames.length} FRAMES • DRAG TO REORDER • CLICK TO SELECT</span>
      </div>

      {project.scenes.sort((a,b)=>a.order-b.order).map(scene=>{
        const frames = project.frames.filter(f=>f.sceneId===scene.id).sort((a,b)=>a.index-b.index)
        return (
          <div key={scene.id} className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <div className="h-10 flex items-center gap-2 px-3 bg-white/[0.04] border-b border-white/10">
              <input value={scene.title} onChange={e=>updateScene(scene.id,{title:e.target.value})} className="flex-1 bg-transparent text-xs font-mono tracking-[0.14em] font-bold text-white focus:outline-none" />
              <span className="text-[10px] font-mono bg-white text-black px-2 py-0.5 rounded-full font-bold">{frames.length}</span>
              <button onClick={()=>addFrame(scene.id)} className="h-7 px-2.5 rounded-full bg-amber-500 text-black text-xs font-bold">+ SHOT</button>
              <button onClick={()=>{ if(confirm('Deletar cena e seus frames?')) deleteScene(scene.id)}} className="w-7 h-7 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-red-300">×</button>
            </div>

            {frames.length===0 ? (
              <div className="p-6 text-center text-xs text-zinc-500 font-mono">Nenhum shot — adicione um frame</div>
            ): (
              <div className="p-2 grid grid-cols-2 lg:grid-cols-3 gap-2">
                {frames.map(f=>{
                  const isSelected = selection.selectedFrameId===f.id
                  return (
                    <div
                      key={f.id}
                      draggable
                      onDragStart={()=>setDragId(f.id)}
                      onDragOver={e=>e.preventDefault()}
                      onDrop={e=>{
                        e.preventDefault()
                        if (!dragId || dragId===f.id) return
                        // reorder within scene
                        const ids = frames.map(x=>x.id)
                        const from = ids.indexOf(dragId)
                        const to = ids.indexOf(f.id)
                        if (from===-1||to===-1) return
                        ids.splice(from,1)
                        ids.splice(to,0,dragId)
                        reorderFrames(ids)
                        setDragId(null)
                      }}
                      onClick={()=>selectFrame(f.id)}
                      className={`group relative rounded-[12px] overflow-hidden border-2 cursor-pointer transition-all ${isSelected?'border-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.25)]':'border-transparent hover:border-white/15 bg-zinc-900'}`}
                    >
                      <VisualFrame shotType={f.shotType} aspectRatio={project.aspectRatio} palette={project.characters.find(c=>c.id===f.characterId)?.palette ?? project.environments.find(en=>en.id===f.environmentId)?.palette} />
                      <div className={`p-2 space-y-1 ${isSelected?'bg-amber-500 text-black':'bg-zinc-900 text-zinc-100'}`}>
                        <div className="flex items-center gap-1">
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${isSelected?'bg-black text-amber-400':'bg-white/10 text-white'}`}>{f.shotType}</span>
                          <span className="text-[10px] font-mono opacity-60">{f.lens} • {f.movement} • {f.duration}s</span>
                          <button onClick={(e)=>{e.stopPropagation(); deleteFrame(f.id)}} className={`ml-auto w-5 h-5 rounded-full flex items-center justify-center text-xs ${isSelected?'bg-black/20 hover:bg-black/30 text-black':'bg-white/10 hover:bg-white/15 text-zinc-300'}`}>×</button>
                        </div>
                        <div className="text-[11px] leading-snug line-clamp-2 opacity-90 min-h-[32px]">{f.action}</div>
                        {f.dialogue && <div className="text-[10px] italic opacity-70 line-clamp-1">“{f.dialogue}”</div>}
                        <div className="flex gap-1 flex-wrap">
                          {f.characterId && <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border ${isSelected?'border-black/20 bg-black/10':'border-white/10 bg-white/5'}`}>{project.characters.find(c=>c.id===f.characterId)?.name?.split(' ')[0]}</span>}
                          {f.environmentId && <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border ${isSelected?'border-black/20 bg-black/10':'border-white/10 bg-white/5'}`}>{project.environments.find(e=>e.id===f.environmentId)?.name?.split(' ')[0]}</span>}
                        </div>
                      </div>
                      {/* drag handle */}
                      <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-black/60 backdrop-blur border border-white/15 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <span className="text-white text-[11px]">⋮⋮</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="px-3 pb-2">
              <div className="flex gap-1 flex-wrap">
                {SHOT_TYPES.slice(0,5).map(st=>(
                  <button key={st} onClick={()=>{
                    // quick add with shot type
                    const id = Math.random().toString(36).slice(2)
                    // use addFrame then update
                    addFrame(scene.id)
                    setTimeout(()=>{
                      const latest = useStore.getState().project.frames[useStore.getState().project.frames.length-1]
                      if(latest) useStore.getState().updateFrame(latest.id,{shotType:st})
                    },0)
                  }} className="text-[10px] font-mono px-2 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10">+{st}</button>
                ))}
              </div>
            </div>
          </div>
        )
      })}

      <div className="rounded-xl border border-dashed border-white/10 p-4 text-center">
        <div className="text-xs text-zinc-400">Arraste frames entre cenas usando o Inspector → Scene, ou reordene dentro da cena por drag-and-drop.</div>
      </div>
    </div>
  )
}
