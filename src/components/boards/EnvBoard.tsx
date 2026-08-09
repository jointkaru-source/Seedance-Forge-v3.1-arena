import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { getProvider } from '../../services/ai'

export function EnvBoard(){
  const project = useStore(s=>s.project)
  const selection = useStore(s=>s.selection)
  const selectEnvironment = useStore(s=>s.selectEnvironment)
  const addEnvironment = useStore(s=>s.addEnvironment)
  const updateEnvironment = useStore(s=>s.updateEnvironment)
  const deleteEnvironment = useStore(s=>s.deleteEnvironment)
  const setAI = useStore(s=>s.setAI)
  const ai = useStore(s=>s.ai)
  const toast = useStore(s=>s.toast)
  const selectedId = selection.selectedEnvironmentId ?? project.environments[0]?.id
  const env = project.environments.find(e=>e.id===selectedId)

  const handleGenerate = async()=>{
    if(!env) return
    setAI({isGenerating:true})
    try{
      const provider = getProvider(ai.providerId, ai.ollamaUrl)
      const ctx = `Environment ${env.name} - ${env.type} - ${env.architecture} - ${env.materials} - ${env.lighting} - ${env.atmosphere} - palette ${env.palette.join(', ')}`
      const res = await provider.generate({ prompt: `Generate ENV LOCK for: ${ctx}. Concise SOAC, anamorphic, consistent architecture.` })
      updateEnvironment(env.id,{promptLock: res.text, lockStatus:'draft'})
      toast('Env Lock gerado — revise e trave', 'success')
    }catch(e:any){ toast('Falha AI: '+(e.message||''), 'error')}
    finally{ setAI({isGenerating:false})}
  }

  return (
    <div className="flex h-full">
      <div className="w-[148px] shrink-0 border-r border-white/5 bg-black/20 flex flex-col">
        <div className="p-2"><button onClick={addEnvironment} className="w-full h-8 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold">+ ENVIRONMENT</button></div>
        <div className="flex-1 overflow-auto p-1.5 space-y-1.5">
          {project.environments.map(e=>(
            <button key={e.id} onClick={()=>selectEnvironment(e.id)} className={`w-full text-left rounded-xl p-2.5 border ${selectedId===e.id?'bg-emerald-500 text-white border-emerald-400':'bg-white/5 border-white/5 hover:bg-white/10 text-zinc-200'}`}>
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-lg bg-black/20 border border-white/10 flex items-center justify-center text-[10px]">⬢</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-mono font-bold tracking-widest truncate">{e.name}</div>
                  <div className="text-[10px] opacity-70 truncate">{e.type || '—'}</div>
                </div>
                <span className={`w-2 h-2 rounded-full ${e.lockStatus==='locked'?'bg-emerald-300': e.lockStatus==='draft'?'bg-amber-400':'bg-zinc-500'}`} />
              </div>
              <div className="flex gap-1 mt-1.5">
                {e.palette.slice(0,4).map((col,i)=> <span key={i} className="w-4 h-4 rounded-full border border-white/15" style={{background:col}} />)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {!env ? <div className="flex-1 p-8 text-sm text-zinc-500">Sem ambiente</div> : (
        <div className="flex-1 overflow-auto p-4 space-y-4">
          <div className="flex gap-2">
            <input value={env.name} onChange={e=>updateEnvironment(env.id,{name:e.target.value})} className="flex-1 bg-transparent text-lg font-display font-bold text-white border-b border-white/10 pb-1 focus:outline-none" />
            <button onClick={()=>deleteEnvironment(env.id)} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-zinc-400">×</button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="TYPE"><input value={env.type ?? ''} onChange={e=>updateEnvironment(env.id,{type:e.target.value})} placeholder="Interior / Exterior" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs" /></Field>
            <Field label="LIGHTING"><input value={env.lighting ?? ''} onChange={e=>updateEnvironment(env.id,{lighting:e.target.value})} placeholder="Volumetric, practicals..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs" /></Field>
          </div>
          <Field label="ARCHITECTURE (SOAC)"><textarea value={env.architecture ?? ''} onChange={e=>updateEnvironment(env.id,{architecture:e.target.value})} rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs" placeholder="Estrutura, escala, materiais..." /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="MATERIALS"><input value={env.materials ?? ''} onChange={e=>updateEnvironment(env.id,{materials:e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs" /></Field>
            <Field label="ATMOSPHERE"><input value={env.atmosphere ?? ''} onChange={e=>updateEnvironment(env.id,{atmosphere:e.target.value})} placeholder="Dusty, cold, haze..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs" /></Field>
          </div>

          <Field label="PALETTE">
            <div className="flex gap-2 flex-wrap">
              {env.palette.map((col,i)=>(
                <div key={i} className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2 py-1">
                  <input type="color" value={col} onChange={e=>{
                    const next=[...env.palette]; next[i]=e.target.value; updateEnvironment(env.id,{palette:next})
                  }} className="w-6 h-6 rounded-full overflow-hidden p-0 border-0" />
                  <span className="text-[11px] font-mono">{col}</span>
                  <button onClick={()=>{
                    const next=env.palette.filter((_,idx)=>idx!==i); updateEnvironment(env.id,{palette:next})
                  }} className="text-zinc-400">×</button>
                </div>
              ))}
              <button onClick={()=>{
                const next=[...env.palette, '#ffffff']; updateEnvironment(env.id,{palette:next})
              }} className="h-8 px-3 rounded-full bg-white/5 border border-white/10 text-xs">+ COLOR</button>
            </div>
          </Field>

          <div className="rounded-xl border p-3 space-y-2" style={{background: env.lockStatus==='locked'?'rgba(16,185,129,0.08)': env.lockStatus==='draft'?'rgba(245,158,11,0.08)':'rgba(255,255,255,0.03)', borderColor: env.lockStatus==='locked'?'rgba(16,185,129,0.25)': env.lockStatus==='draft'?'rgba(245,158,11,0.25)':'rgba(255,255,255,0.08)'}}>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-[0.16em] font-bold">ENV LOCK</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${env.lockStatus==='locked'?'bg-emerald-500 text-black border-emerald-500': env.lockStatus==='draft'?'bg-amber-500 text-black border-amber-500':'bg-zinc-700 text-zinc-300 border-zinc-600'}`}>{env.lockStatus.toUpperCase()}</span>
            </div>
            <textarea value={env.promptLock ?? ''} onChange={e=>updateEnvironment(env.id,{promptLock:e.target.value, lockStatus: e.target.value? 'draft':'missing'})} rows={4} placeholder="SOAC Env Lock — descritor canônico do ambiente..." className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-xs leading-relaxed focus:outline-none focus:border-emerald-500/40" />
            <div className="flex gap-2">
              <button onClick={handleGenerate} disabled={ai.isGenerating} className="flex-1 h-9 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold tracking-widest">{ai.isGenerating?'GENERATING...':'GENERATE LOCK (AI)'}</button>
              <button onClick={()=>{ if(env.promptLock) { updateEnvironment(env.id,{lockStatus:'locked'}); toast('Env Lock aprovado','success')}}} className="h-9 px-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold">LOCK ✓</button>
            </div>
          </div>
          <Field label="NOTES"><textarea value={env.notes ?? ''} onChange={e=>updateEnvironment(env.id,{notes:e.target.value})} rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs" /></Field>
        </div>
      )}
    </div>
  )
}
function Field({label, children}:{label:string, children:React.ReactNode}){
  return <div><div className="text-[10px] font-mono tracking-[0.14em] text-white/40 mb-1.5">{label}</div>{children}</div>
}
