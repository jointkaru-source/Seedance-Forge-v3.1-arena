import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { getProvider } from '../../services/ai'

export function CharBoard(){
  const project = useStore(s=>s.project)
  const selection = useStore(s=>s.selection)
  const selectCharacter = useStore(s=>s.selectCharacter)
  const addCharacter = useStore(s=>s.addCharacter)
  const updateCharacter = useStore(s=>s.updateCharacter)
  const deleteCharacter = useStore(s=>s.deleteCharacter)
  const setAI = useStore(s=>s.setAI)
  const ai = useStore(s=>s.ai)
  const toast = useStore(s=>s.toast)
  const selectedId = selection.selectedCharacterId ?? project.characters[0]?.id
  const char = project.characters.find(c=>c.id===selectedId)

  const [genPrompt, setGenPrompt] = useState('')

  const handleGenerateLock = async()=>{
    if(!char) return
    setAI({isGenerating:true})
    try{
      const provider = getProvider(ai.providerId, ai.ollamaUrl)
      const context = `Character: ${char.name} - ${char.physicalDescription} - ${char.wardrobe} - palette ${char.palette.join(', ')}`
      const res = await provider.generate({ prompt: `Generate CHARACTER PROMPT LOCK for: ${context}. Keep concise, cinematic, 35mm, consistent identity.` })
      // require acceptance: put into draft first
      updateCharacter(char.id, { promptLock: res.text, lockStatus:'draft' })
      setGenPrompt(res.text)
      toast('Prompt Lock gerado — revise e trave', 'success')
    } catch(e:any){
      toast('Falha AI: '+(e.message||''), 'error')
    } finally { setAI({isGenerating:false})}
  }

  return (
    <div className="flex h-full">
      <div className="w-[148px] shrink-0 border-r border-white/5 bg-black/20 flex flex-col">
        <div className="p-2">
          <button onClick={addCharacter} className="w-full h-8 rounded-full bg-violet-500 hover:bg-violet-400 text-white text-xs font-bold">+ CHARACTER</button>
        </div>
        <div className="flex-1 overflow-auto p-1.5 space-y-1.5">
          {project.characters.map(c=>(
            <button key={c.id} onClick={()=>selectCharacter(c.id)} className={`w-full text-left rounded-xl p-2.5 border flex flex-col gap-1.5 transition ${selectedId===c.id?'bg-violet-500 text-white border-violet-400':'bg-white/5 border-white/5 hover:bg-white/10 text-zinc-200'}`}>
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-full bg-black/20 border border-white/10 flex items-center justify-center text-[11px] font-bold">{c.name.slice(0,2)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-mono font-bold tracking-widest leading-none truncate">{c.name}</div>
                  <div className="text-[10px] opacity-70 truncate">{c.role || '—'}</div>
                </div>
                <span className={`w-2 h-2 rounded-full ${c.lockStatus==='locked'?'bg-emerald-400':c.lockStatus==='draft'?'bg-amber-400':'bg-zinc-500'}`} />
              </div>
              <div className="flex gap-1">
                {c.palette.slice(0,4).map((col,i)=> <span key={i} className="w-4 h-4 rounded-full border border-white/15" style={{background:col}} />)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {!char ? <div className="flex-1 p-8 text-sm text-zinc-500">Sem personagem</div> : (
        <div className="flex-1 overflow-auto p-4 space-y-4">
          <div className="flex gap-2 items-start">
            <div className="flex-1">
              <input value={char.name} onChange={e=>updateCharacter(char.id,{name:e.target.value})} className="w-full bg-transparent text-lg font-display font-bold tracking-wide text-white focus:outline-none border-b border-white/10 pb-1" />
              <div className="grid grid-cols-2 gap-2 mt-2">
                <input value={char.role ?? ''} onChange={e=>updateCharacter(char.id,{role:e.target.value})} placeholder="Role" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs" />
                <input value={char.age ?? ''} onChange={e=>updateCharacter(char.id,{age:e.target.value})} placeholder="Age" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs" />
              </div>
            </div>
            <button onClick={()=>deleteCharacter(char.id)} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-red-300">×</button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="PHYSICAL"><textarea value={char.physicalDescription ?? ''} onChange={e=>updateCharacter(char.id,{physicalDescription:e.target.value})} rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs" /></Field>
            <Field label="PERSONALITY"><textarea value={char.personality ?? ''} onChange={e=>updateCharacter(char.id,{personality:e.target.value})} rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs" /></Field>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Field label="WARDROBE"><input value={char.wardrobe ?? ''} onChange={e=>updateCharacter(char.id,{wardrobe:e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs" /></Field>
            <Field label="HAIR"><input value={char.hair ?? ''} onChange={e=>updateCharacter(char.id,{hair:e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs" /></Field>
            <Field label="EYES"><input value={char.eyes ?? ''} onChange={e=>updateCharacter(char.id,{eyes:e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs" /></Field>
          </div>

          <Field label="PALETTE">
            <div className="flex gap-2 flex-wrap">
              {char.palette.map((col,i)=>(
                <div key={i} className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2 py-1">
                  <input type="color" value={col} onChange={e=>{
                    const next=[...char.palette]; next[i]=e.target.value; updateCharacter(char.id,{palette:next})
                  }} className="w-6 h-6 rounded-full overflow-hidden p-0 border-0" />
                  <span className="text-[11px] font-mono">{col}</span>
                  <button onClick={()=>{
                    const next=char.palette.filter((_,idx)=>idx!==i); updateCharacter(char.id,{palette:next})
                  }} className="text-zinc-400 hover:text-white">×</button>
                </div>
              ))}
              <button onClick={()=>{
                const next=[...char.palette, '#ffffff']; updateCharacter(char.id,{palette:next})
              }} className="h-8 px-3 rounded-full bg-white/5 border border-white/10 text-xs">+ COLOR</button>
            </div>
          </Field>

          <Field label="TURNAROUND REFERENCES">
            <div className="grid grid-cols-2 gap-2">
              {(['front','profile','threeQuarter','back'] as const).map(k=>(
                <input key={k} value={(char.turnaround as any)[k] ?? ''} onChange={e=> updateCharacter(char.id,{turnaround:{...char.turnaround, [k]: e.target.value}})} placeholder={k} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs placeholder:uppercase placeholder:text-[10px]" />
              ))}
            </div>
          </Field>

          <Field label={`REFERENCES — ARRASTE IMAGENS AQUI (${char.references.length})`}>
            <div
              onDragOver={e=>{e.preventDefault(); (e.currentTarget as HTMLElement).style.borderColor='rgba(167,139,250,0.5)'}}
              onDragLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.1)'}}
              onDrop={async e=>{
                e.preventDefault()
                ;(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.1)'
                const files = Array.from(e.dataTransfer.files).filter(f=> f.type.startsWith('image/'))
                if(!files.length){ toast('Solte apenas imagens aqui','error'); return}
                for(const f of files){
                  const dataUrl = await new Promise<string>(res=>{
                    const r=new FileReader(); r.onload=()=>res(r.result as string); r.readAsDataURL(f)
                  })
                  updateCharacter(char.id, { references: [...char.references, dataUrl] })
                }
                toast(`${files.length} imagem(ns) adicionada(s)`, 'success')
              }}
              className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-3 min-h-[96px]"
            >
              {char.references.length===0 ? (
                <div className="text-center py-4">
                  <div className="text-xs text-zinc-400">Arraste imagens aqui ou solte no canvas</div>
                  <div className="text-[11px] text-white/30 mt-1">Formatos: PNG, JPG, WEBP — também aceita drag-drop global</div>
                  <label className="mt-3 inline-flex h-7 px-3 rounded-full bg-white/5 border border-white/10 text-xs cursor-pointer hover:bg-white/10">
                    Escolher ficheiros
                    <input type="file" accept="image/*" multiple className="hidden" onChange={async e=>{
                      const files = Array.from(e.target.files ?? [])
                      if(!files.length) return
                      const urls = await Promise.all(files.map(f=> new Promise<string>(res=>{ const r=new FileReader(); r.onload=()=>res(r.result as string); r.readAsDataURL(f)})))
                      const cur = useStore.getState().project.characters.find(c=>c.id===char.id)!.references
                      updateCharacter(char.id, { references: [...cur, ...urls] })
                      toast(`${files.length} imagem(ns) adicionada(s)`, 'success')
                      e.target.value=''
                    }} />
                  </label>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {char.references.map((ref,i)=>(
                    <div key={i} className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/20">
                      <img src={ref} alt={`ref ${i}`} className="w-full h-24 object-cover" />
                      <button onClick={()=> updateCharacter(char.id, { references: char.references.filter((_,idx)=> idx!==i) })} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 border border-white/10 text-white text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center">×</button>
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] font-mono px-1.5 py-0.5 text-white/70 truncate">REF {i+1}</div>
                    </div>
                  ))}
                  <label className="h-24 rounded-xl border border-dashed border-white/10 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-1 cursor-pointer">
                    <span className="text-lg leading-none">＋</span>
                    <span className="text-[10px] font-mono">ADD</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={async e=>{
                      const files = Array.from(e.target.files ?? [])
                      if(!files.length) return
                      const urls = await Promise.all(files.map(f=> new Promise<string>(res=>{ const r=new FileReader(); r.onload=()=>res(r.result as string); r.readAsDataURL(f)})))
                      const cur = useStore.getState().project.characters.find(c=>c.id===char.id)!.references
                      updateCharacter(char.id, { references: [...cur, ...urls] })
                      toast(`${files.length} imagem(ns) adicionada(s)`, 'success')
                      e.target.value=''
                    }} />
                  </label>
                </div>
              )}
            </div>
          </Field>

          <div className="rounded-xl border p-3 space-y-2" style={{background: char.lockStatus==='locked'?'rgba(16,185,129,0.08)': char.lockStatus==='draft'?'rgba(245,158,11,0.08)':'rgba(255,255,255,0.03)', borderColor: char.lockStatus==='locked'?'rgba(16,185,129,0.25)': char.lockStatus==='draft'?'rgba(245,158,11,0.25)':'rgba(255,255,255,0.08)'}}>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-[0.16em] font-bold">PROMPT LOCK</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${char.lockStatus==='locked'?'bg-emerald-500 text-black border-emerald-500': char.lockStatus==='draft'?'bg-amber-500 text-black border-amber-500':'bg-zinc-700 text-zinc-300 border-zinc-600'}`}>{char.lockStatus.toUpperCase()}</span>
              <span className="ml-auto text-[10px] font-mono text-white/40">CANONICAL IDENTITY</span>
            </div>
            <textarea value={char.promptLock ?? ''} onChange={e=>updateCharacter(char.id,{promptLock:e.target.value, lockStatus: e.target.value? 'draft':'missing'})} rows={4} placeholder="Cole ou gere o Prompt Lock — descritor canônico que todos os shots herdarão..." className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-xs leading-relaxed focus:outline-none focus:border-violet-500/40" />
            <div className="flex gap-2">
              <button onClick={handleGenerateLock} disabled={ai.isGenerating} className="flex-1 h-9 rounded-full bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-white text-xs font-bold tracking-widest flex items-center justify-center gap-2">
                {ai.isGenerating ? 'GENERATING...' : 'GENERATE LOCK (AI)'}
              </button>
              <button onClick={()=>{ if(char.promptLock) { updateCharacter(char.id,{lockStatus:'locked'}); toast('Lock aprovado', 'success') } }} className="h-9 px-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold">LOCK ✓</button>
              <button onClick={()=>{ updateCharacter(char.id,{lockStatus:'missing', promptLock:''})}} className="h-9 px-3 rounded-full bg-white/5 border border-white/10 text-xs">CLEAR</button>
            </div>
            {genPrompt && <div className="text-[11px] text-zinc-400 leading-relaxed">Última geração: {genPrompt.slice(0,160)}…</div>}
          </div>

          <Field label="NOTES"><textarea value={char.notes ?? ''} onChange={e=>updateCharacter(char.id,{notes:e.target.value})} rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs" placeholder="Notas de continuidade..." /></Field>
        </div>
      )}
    </div>
  )
}
function Field({label, children}:{label:string, children:React.ReactNode}){
  return <div><div className="text-[10px] font-mono tracking-[0.14em] text-white/40 mb-1.5">{label}</div>{children}</div>
}
