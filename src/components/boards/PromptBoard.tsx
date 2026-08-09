import { useMemo, useState } from 'react'
import { useStore } from '../../store/useStore'
import { compileShotPromptFromState } from '../../domain/prompt'
import { copyToClipboard } from '../../utils/clipboard'
import { PLATFORMS, Platform } from '../../types/project'
import { getProvider } from '../../services/ai'

export function PromptBoard(){
  const project = useStore(s=>s.project)
  const selection = useStore(s=>s.selection)
  const updateFrame = useStore(s=>s.updateFrame)
  const ai = useStore(s=>s.ai)
  const setAI = useStore(s=>s.setAI)
  const toast = useStore(s=>s.toast)
  const frame = project.frames.find(f=>f.id===selection.selectedFrameId)
  const [platform, setPlatform] = useState<Platform>('seedance')
  const [visualStyle, setVisualStyle] = useState('cinematic, photorealistic, anamorphic, dramatic lighting')
  const [isBatch, setIsBatch] = useState(false)

  const compiled = useMemo(()=>{
    if(!frame) return ''
    return compileShotPromptFromState(frame, project.characters, project.environments, project.depthCells, project.aspectRatio, platform) + (visualStyle ? `\nStyle: ${visualStyle}` : '')
  }, [frame, project.characters, project.environments, project.depthCells, project.aspectRatio, platform, visualStyle])

  const handleCopy = async()=>{
    const ok = await copyToClipboard(compiled)
    toast(ok ? 'Prompt copiado' : 'Falha ao copiar','success')
  }
  const handleApplyToFrame = ()=>{
    if(!frame) return
    updateFrame(frame.id,{prompt: compiled})
    toast('Prompt aplicado ao frame','success')
  }
  const handleGenerateAI = async()=>{
    if(!frame) return
    setAI({isGenerating:true})
    try{
      const provider = getProvider(ai.providerId, ai.ollamaUrl)
      const ctx = `Shot ${frame.shotType} ${frame.lens} ${frame.movement}\nAction: ${frame.action}\nLocks: ${project.characters.find(c=>c.id===frame.characterId)?.promptLock ?? ''} | ${project.environments.find(e=>e.id===frame.environmentId)?.promptLock ?? ''}`
      const res = await provider.generate({ prompt: `Refine cinematic prompt for ${ctx}. Platform ${platform}. Keep structured.` })
      // show but not auto commit — put in visualStyle? Instead update compiled preview via visualStyle injection? Simpler: apply to frame draft
      updateFrame(frame.id,{prompt: res.text})
      toast('Prompt gerado via AI — revisado no frame','success')
    }catch(e:any){ toast('AI falhou: '+(e.message||''),'error')}
    finally{ setAI({isGenerating:false})}
  }

  if(!frame) return <div className="p-8 text-sm text-zinc-500">Selecione um frame no Storyboard para compilar prompt.</div>

  const char = project.characters.find(c=>c.id===frame.characterId)
  const env = project.environments.find(e=>e.id===frame.environmentId)

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 overflow-auto">
          {PLATFORMS.map(p=>(
            <button key={p.id} onClick={()=>setPlatform(p.id)} className={`h-7 px-2.5 rounded-full text-[11px] font-mono tracking-widest border ${platform===p.id?'bg-amber-500 border-amber-500 text-black font-bold':'bg-white/5 border-white/10 text-white/70 hover:text-white'}`}>{p.label.toUpperCase()}</button>
          ))}
        </div>
        <label className="ml-auto flex items-center gap-2 text-[11px] font-mono">
          <input type="checkbox" checked={isBatch} onChange={e=>setIsBatch(e.target.checked)} /> BATCH
        </label>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="text-[10px] font-mono tracking-widest text-white/40">SHOT</div>
          <div className="text-xs font-mono font-bold mt-1">{frame.shotType} • {frame.lens} • {frame.movement}</div>
          <div className="text-xs text-zinc-400 mt-1 line-clamp-2">{frame.action}</div>
        </div>
        <div className={`rounded-xl border p-3 ${char?.lockStatus==='locked'?'bg-emerald-500/10 border-emerald-500/20':'bg-white/[0.03] border-white/10'}`}>
          <div className="text-[10px] font-mono tracking-widest text-white/40">CHARACTER LOCK {char ? `• ${char.name}` : '• none'}</div>
          <div className="text-[11px] leading-snug mt-1 line-clamp-3 text-zinc-300">{char?.promptLock || '— selecione personagem no Inspector → Locks'}</div>
        </div>
        <div className={`rounded-xl border p-3 ${env?.lockStatus==='locked'?'bg-sky-500/10 border-sky-500/20':'bg-white/[0.03] border-white/10'}`}>
          <div className="text-[10px] font-mono tracking-widest text-white/40">ENV LOCK {env ? `• ${env.name}` : '• none'}</div>
          <div className="text-[11px] leading-snug mt-1 line-clamp-3 text-zinc-300">{env?.promptLock || '— selecione ambiente'}</div>
        </div>
      </div>

      <div>
        <div className="text-[10px] font-mono tracking-widest text-white/40 mb-1.5">VISUAL STYLE (appended)</div>
        <input value={visualStyle} onChange={e=>setVisualStyle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs" placeholder="cinematic, photorealistic..." />
      </div>

      <div className="rounded-xl border border-white/10 bg-black/30 overflow-hidden">
        <div className="h-8 flex items-center px-3 border-b border-white/5 bg-white/[0.02]">
          <span className="text-[10px] font-mono tracking-[0.14em] font-bold">COMPILED PROMPT</span>
          <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500 text-black font-bold">{platform.toUpperCase()}</span>
          <span className="ml-auto text-[10px] font-mono text-white/30">{compiled.length} chars</span>
        </div>
        <textarea value={compiled} readOnly rows={8} className="w-full bg-transparent p-3 text-[12.5px] leading-6 font-mono text-zinc-100 focus:outline-none" />
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={handleCopy} className="h-9 px-4 rounded-full bg-white text-black text-xs font-bold tracking-widest">COPY PROMPT</button>
        <button onClick={handleApplyToFrame} className="h-9 px-4 rounded-full bg-amber-500 text-black text-xs font-bold tracking-widest">APPLY TO FRAME</button>
        <button onClick={handleGenerateAI} disabled={ai.isGenerating} className="h-9 px-4 rounded-full bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-white text-xs font-bold tracking-widest">{ai.isGenerating?'GENERATING...':'GENERATE WITH AI'}</button>
        <button onClick={()=>{
          const all = project.frames.map(f=> compileShotPromptFromState(f, project.characters, project.environments, project.depthCells, project.aspectRatio, platform)).join('\n\n---\n\n')
          copyToClipboard(all).then(()=>toast('Todos os prompts copiados','success'))
        }} className="h-9 px-4 rounded-full bg-white/5 border border-white/10 text-white text-xs font-mono tracking-widest">COPY ALL SHOTS</button>
        <span className="text-[11px] text-zinc-500 ml-auto self-center">Determinístico • derivado do state canônico • sem invenção silenciosa</span>
      </div>

      {frame.prompt && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
          <div className="text-[10px] font-mono tracking-widest text-amber-300">FRAME PROMPT (persistido)</div>
          <div className="text-xs font-mono leading-relaxed mt-1 whitespace-pre-wrap">{frame.prompt}</div>
        </div>
      )}
    </div>
  )
}
