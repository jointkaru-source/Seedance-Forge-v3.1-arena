import { useState } from 'react'
import { useStore } from '../../store/useStore'
import type { ToolCategory } from '../../types/project'

const cats: ToolCategory[] = ['Video','Image','Audio','Script','Upscale','Custom']

export function ToolsBoard(){
  const project = useStore(s=>s.project)
  const addTool = useStore(s=>s.addTool)
  const updateTool = useStore(s=>s.updateTool)
  const deleteTool = useStore(s=>s.deleteTool)
  const toast = useStore(s=>s.toast)
  const [filter, setFilter] = useState<ToolCategory | 'All'>('All')
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newCat, setNewCat] = useState<ToolCategory>('Custom')

  const filtered = filter==='All' ? project.aiTools : project.aiTools.filter(t=>t.category===filter)

  const handleAdd = ()=>{
    try{
      if(!newName.trim() || !newUrl.trim()) return toast('Nome e URL obrigatórios','error')
      new URL(newUrl)
      addTool({ name:newName.trim(), url:newUrl.trim(), category:newCat, enabled:true })
      setNewName(''); setNewUrl('')
      toast('Tool adicionada','success')
    } catch{ toast('URL inválida','error')}
  }

  return (
    <div className="p-3 space-y-3">
      <div className="flex gap-1 overflow-auto pb-1">
        {(['All', ...cats] as const).map(c=>(
          <button key={c} onClick={()=>setFilter(c as any)} className={`shrink-0 h-7 px-2.5 rounded-full text-[11px] font-mono tracking-widest border ${filter===c?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/70 hover:text-white'}`}>{(c as string).toUpperCase()}</button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(t=>(
          <div key={t.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 flex gap-3 items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold border ${t.category==='Video'?'bg-sky-500/15 border-sky-500/20 text-sky-300': t.category==='Image'?'bg-fuchsia-500/15 border-fuchsia-500/20 text-fuchsia-300': t.category==='Audio'?'bg-emerald-500/15 border-emerald-500/20 text-emerald-300':'bg-white/10 border-white/10 text-zinc-300'}`}>{t.category}</span>
                <span className="text-xs font-semibold truncate">{t.name}</span>
                <span className={`w-2 h-2 rounded-full ml-auto ${t.enabled?'bg-emerald-400':'bg-zinc-500'}`} />
              </div>
              <a href={t.url} target="_blank" rel="noreferrer" className="text-[11px] text-sky-300 hover:text-sky-200 truncate block mt-1 underline decoration-sky-300/30">{t.url}</a>
              {t.notes && <div className="text-[11px] text-zinc-400 mt-1">{t.notes}</div>}
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={()=>updateTool(t.id,{enabled:!t.enabled})} className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs ${t.enabled?'bg-emerald-500 border-emerald-500 text-black':'bg-white/5 border-white/10 text-zinc-400'}`}>{t.enabled?'●':'○'}</button>
              <button onClick={()=>deleteTool(t.id)} className="w-7 h-7 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-red-300">×</button>
            </div>
          </div>
        ))}
        {filtered.length===0 && <div className="text-xs text-zinc-500 text-center py-6">Nenhuma tool nesta categoria</div>}
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
        <div className="text-[10px] font-mono tracking-widest text-white/40">ADD CUSTOM TOOL</div>
        <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Name (ex: Krea)" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs" />
        <input value={newUrl} onChange={e=>setNewUrl(e.target.value)} placeholder="https://..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs" />
        <div className="flex gap-2">
          <select value={newCat} onChange={e=>setNewCat(e.target.value as ToolCategory)} className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs">
            {cats.map(c=> <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={handleAdd} className="h-9 px-4 rounded-full bg-white text-black text-xs font-bold tracking-widest">ADD</button>
        </div>
      </div>
    </div>
  )
}
