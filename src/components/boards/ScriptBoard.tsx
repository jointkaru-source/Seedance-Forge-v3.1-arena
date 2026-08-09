import { useMemo, useState } from 'react'
import { useStore } from '../../store/useStore'
import { parseFountain, fountainPreviewHtml } from '../../domain/fountain'

const SAMPLE_FOUNTAIN = `Title: ECLIPSE
Credit: Written by
Author: A. Karu

INT. OBSERVATORY - NIGHT

A derelict dome. Wind howls through the aperture. ELARA VOSS (32) tightens her coat, compass in hand.

               ELARA
     We shouldn't be here after dark.

She adjusts the brass telescope. The compass SPINS.

               MARCUS (O.S.)
     It's already awake.

EXT. RIDGE - DAWN

First light cuts the valley. The observatory stands silhouette.

               ELARA (V.O.)
     Every eclipse takes something.

CUT TO:
`

export function ScriptBoard(){
  const project = useStore(s=>s.project)
  const addSourceDoc = useStore(s=>s.addSourceDoc)
  const updateProject = useStore(s=>s.updateProject)
  const toast = useStore(s=>s.toast)
  const ui = useStore(s=>s.ui)
  const setUI = useStore(s=>s.setUI)
  const [text, setText] = useState(project.sourceDocuments.find(d=>d.type==='FOUNTAIN')?.content ?? SAMPLE_FOUNTAIN)

  const parsed = useMemo(()=> parseFountain(text), [text])
  const previewHtml = useMemo(()=> fountainPreviewHtml(parsed), [parsed])

  const handleExtract = ()=>{
    // create scenes/chars from parsed
    updateProject(p=>{
      // add scenes not existing
      parsed.scenes.forEach((sc, i)=>{
        const exists = p.scenes.some(s=> s.title.trim().toLowerCase()===sc.heading.trim().toLowerCase())
        if(!exists){
          p.scenes.push({ id: `scene_${Math.random().toString(36).slice(2,8)}`, title: sc.heading, order: p.scenes.length + i, description: sc.content.slice(0,3).join(' ') })
        }
      })
      parsed.characters.forEach(name=>{
        if(!p.characters.some(c=>c.name===name)){
          p.characters.push({ id:`char_${Math.random().toString(36).slice(2,8)}`, name, palette:['#3a3a3a','#c9a86a','#6b7f8c'], turnaround:{}, references:[], promptLock:'', lockStatus:'missing' })
        }
      })
    })
    addSourceDoc({ name:'Screenplay.fountain', type:'FOUNTAIN', content: text })
    toast(`Extraído: ${parsed.scenes.length} cenas, ${parsed.characters.length} personagens`, 'success')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="h-9 flex items-center gap-1 p-1 bg-black/20 border-b border-white/5">
        <button onClick={()=>setUI({scriptMode:'edit'})} className={`flex-1 h-7 rounded-full text-[11px] font-mono tracking-widest font-semibold ${ui.scriptMode==='edit'?'bg-white text-black':'text-white/60 hover:text-white'}`}>EDIT</button>
        <button onClick={()=>setUI({scriptMode:'preview'})} className={`flex-1 h-7 rounded-full text-[11px] font-mono tracking-widest font-semibold ${ui.scriptMode==='preview'?'bg-white text-black':'text-white/60 hover:text-white'}`}>PREVIEW</button>
        <span className="hidden sm:inline text-[10px] font-mono text-white/30 ml-2">{parsed.tokens.length} TOKENS</span>
      </div>

      <div className="px-3 py-2 flex items-center gap-2 border-b border-white/5 bg-white/[0.02]">
        <div className="text-[10px] font-mono tracking-widest text-white/40">{parsed.scenes.length} SCENES • {parsed.characters.length} CHARS</div>
        <button onClick={handleExtract} className="ml-auto h-7 px-3 rounded-full bg-amber-500 text-black text-xs font-bold tracking-widest">EXTRACT → PROJECT</button>
      </div>

      {ui.scriptMode==='edit' ? (
        <div className="flex-1 relative">
          <textarea value={text} onChange={e=>setText(e.target.value)} className="absolute inset-0 w-full h-full bg-[#0a0a0c] text-zinc-200 font-mono text-[12.5px] leading-6 p-4 focus:outline-none resize-none" spellCheck={false} placeholder="Escreva em Fountain..." />
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-6 bg-[#f7f5ef] text-zinc-900">
          <div className="max-w-[640px] mx-auto font-mono text-[13px] leading-relaxed" dangerouslySetInnerHTML={{__html: previewHtml}} />
        </div>
      )}

      <div className="border-t border-white/5 p-2 bg-black/20">
        <div className="flex flex-wrap gap-1">
          {parsed.characters.map(c=> <span key={c} className="text-[10px] font-mono px-2 py-1 rounded-full bg-violet-500/15 border border-violet-500/20 text-violet-300">{c}</span>)}
          {parsed.characters.length===0 && <span className="text-xs text-zinc-500">Nenhum personagem detectado — use CUES em MAIÚSCULAS.</span>}
        </div>
        <div className="mt-2 flex gap-1 flex-wrap">
          {parsed.scenes.map(s=> <span key={s.heading} className="text-[10px] font-mono px-2 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300">{s.heading}</span>)}
        </div>
      </div>
    </div>
  )
}
