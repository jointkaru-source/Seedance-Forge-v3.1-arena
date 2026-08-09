import { useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import { ASPECT_RATIOS } from '../types/project'
import { toCSV, toJSON, toSeedance, downloadFile } from '../services/export'
import { getProvider } from '../services/ai'

export function TopBar(){
  const project = useStore(s=>s.project)
  const setProjectMeta = useStore(s=>s.setProjectMeta)
  const setUI = useStore(s=>s.setUI)
  const ai = useStore(s=>s.ai)
  const setAI = useStore(s=>s.setAI)
  const toast = useStore(s=>s.toast)
  const loadProject = useStore(s=>s.loadProject)
  const undo = useStore(s=>s.undo)
  const redo = useStore(s=>s.redo)
  const boards = useStore(s=>s.boards)
  const fileRef = useRef<HTMLInputElement>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const [showAI, setShowAI] = useState(false)

  const handleSave = ()=>{
    const content = toSeedance(project, boards)
    downloadFile(content, `${project.title.replace(/\s+/g,'_')}.seedance`, 'application/json')
    // also try Tauri IPC if available
    // @ts-ignore
    if (window.__TAURI__?.core?.invoke) {
      // @ts-ignore
      window.__TAURI__.core.invoke('save_project_file', { path: `${project.title}.seedance`, content }).catch(()=>{})
    }
    toast('Projeto salvo (.seedance)', 'success')
  }
  const handleExportJSON = ()=>{
    downloadFile(toJSON(project), `${project.title.replace(/\s+/g,'_')}.json`, 'application/json')
    toast('JSON exportado', 'success')
  }
  const handleExportCSV = ()=>{
    downloadFile(toCSV(project), `${project.title.replace(/\s+/g,'_')}_shots.csv`, 'text/csv')
    toast('CSV exportado', 'success')
  }
  const handleLoad = (e: React.ChangeEvent<HTMLInputElement>)=>{
    const f = e.target.files?.[0]
    if(!f) return
    const reader = new FileReader()
    reader.onload = ()=>{
      try{
        const text = reader.result as string
        const data = JSON.parse(text)
        const proj = data.project ?? data
        if(!proj.title) throw new Error('Invalid project')
        loadProject(proj, data.boards)
        toast('Projeto carregado', 'success')
      }catch(err:any){ toast('Falha ao carregar: '+(err.message||''), 'error')}
    }
    reader.readAsText(f)
    e.target.value=''
  }
  const handleImportSource = (e: React.ChangeEvent<HTMLInputElement>)=>{
    const f = e.target.files?.[0]
    if(!f) return
    const reader = new FileReader()
    reader.onload = ()=>{
      const content = reader.result as string
      useStore.getState().addSourceDoc({ name: f.name, type: f.name.split('.').pop()?.toUpperCase() ?? 'TXT', content })
      toast(`Fonte importada: ${f.name}`, 'success')
    }
    reader.readAsText(f)
    e.target.value=''
  }

  const discoverOllama = async()=>{
    setAI({isGenerating:true})
    try{
      const provider = getProvider('ollama', ai.ollamaUrl)
      const models = await provider.listModels?.() ?? []
      setAI({ ollamaModels: models })
      toast(models.length ? `Ollama: ${models.length} modelos` : 'Ollama sem modelos ou offline', models.length?'success':'error')
    } catch(e:any){ toast('Ollama offline: '+(e.message||''), 'error')}
    finally{ setAI({isGenerating:false})}
  }

  return (
    <div className="h-[56px] shrink-0 glass-strong border-b border-white/[0.08] flex items-center gap-3 px-3 no-print relative z-20">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center font-display font-bold text-black text-[14px] tracking-tighter">SF</div>
        <div className="hidden sm:block">
          <div className="font-display font-bold text-[13px] leading-none tracking-widest">SEEDANCE FORGE</div>
          <div className="font-mono text-[10px] tracking-[0.18em] text-white/40 -mt-0.5">v3.1 • CINEMATIC PRE-PRODUCTION</div>
        </div>
      </div>

      <div className="h-8 w-px bg-white/10 hidden md:block" />

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <input value={project.title} onChange={e=>setProjectMeta({title:e.target.value})} className="hidden lg:block bg-white/[0.06] border border-white/10 rounded-full px-3 py-1.5 text-xs font-mono tracking-widest text-white w-[220px] focus:outline-none focus:border-amber-500/50" />
        <input value={project.director ?? ''} onChange={e=>setProjectMeta({director:e.target.value})} placeholder="Director" className="hidden xl:block bg-white/[0.04] border border-white/10 rounded-full px-3 py-1.5 text-xs text-white/80 w-[160px] placeholder:text-white/30 focus:outline-none" />
        <select value={project.aspectRatio} onChange={e=>setProjectMeta({aspectRatio: e.target.value as any})} className="bg-zinc-900 border border-white/10 rounded-full px-2.5 py-1.5 text-xs font-mono hidden md:block">
          {ASPECT_RATIOS.map(ar=> <option key={ar} value={ar}>{ar}</option>)}
        </select>
        <div className="hidden md:flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2 py-1">
          <span className="text-[10px] font-mono text-white/40">FPS</span>
          <input type="number" value={project.fps} onChange={e=>setProjectMeta({fps: parseInt(e.target.value)||24})} className="w-12 bg-transparent text-xs font-mono text-white focus:outline-none" />
        </div>
        <span className="hidden lg:inline-flex text-[10px] font-mono tracking-widest bg-white/5 border border-white/10 rounded-full px-2.5 py-1.5 text-white/50">{project.id.slice(-8).toUpperCase()}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <button onClick={undo} title="Undo (Ctrl+Z)" className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70">↺</button>
        <button onClick={redo} title="Redo (Ctrl+Shift+Z)" className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70">↻</button>
        <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block" />
        <button onClick={handleSave} className="hidden sm:inline-flex h-8 px-3 rounded-full bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold tracking-widest items-center gap-1.5">SAVE</button>
        <button onClick={()=>fileRef.current?.click()} className="hidden sm:inline-flex h-8 px-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-mono tracking-widest">LOAD</button>
        <button onClick={()=>importRef.current?.click()} className="hidden md:inline-flex h-8 px-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-mono tracking-widest">IMPORT</button>

        <div className="hidden lg:flex items-center gap-1 ml-1">
          <button onClick={handleExportJSON} className="h-8 px-2.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-white/70 hover:text-white">JSON</button>
          <button onClick={handleExportCSV} className="h-8 px-2.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-white/70 hover:text-white">CSV</button>
          <button onClick={()=>window.print()} className="h-8 px-2.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-white/70 hover:text-white">PDF</button>
        </div>

        <button onClick={()=>setUI({showBible:true})} className="h-8 px-3 rounded-full bg-violet-500 hover:bg-violet-400 text-white text-xs font-bold tracking-widest hidden sm:inline-flex">BIBLE</button>
        <button onClick={()=>setUI({showAnimatic:true})} className="h-8 px-3 rounded-full bg-white text-black text-xs font-bold tracking-widest inline-flex items-center gap-1"><span className="hidden sm:inline">ANIMATIC</span><span>▶</span></button>

        <div className="relative ml-1 flex items-center gap-1.5 pl-2 border-l border-white/10">
          <button onClick={()=>setShowAI(v=>!v)} className="flex items-center gap-2 h-8 px-3 rounded-full bg-zinc-900 border border-white/10 hover:bg-zinc-800">
            <div className={`w-2 h-2 rounded-full ${ai.providerId==='mock'?'bg-emerald-400':'bg-sky-400'} animate-pulse`} />
            <span className="hidden xl:inline text-[10px] font-mono tracking-widest text-white/80">{ai.providerId==='mock'?'MOCK OFFLINE':'OLLAMA'}</span>
            <span className="text-white/40 text-xs">▾</span>
          </button>
          {showAI && (
            <div className="absolute right-0 top-10 w-[320px] glass-strong rounded-2xl border border-white/10 p-3 shadow-2xl z-50">
              <div className="text-[11px] font-mono tracking-widest font-bold">AI PROVIDER</div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button onClick={()=>{ setAI({providerId:'mock'}); setShowAI(false)}} className={`h-9 rounded-xl border text-xs font-bold ${ai.providerId==='mock'?'bg-emerald-500 text-black border-emerald-500':'bg-white/5 border-white/10 text-white'}`}>MOCK (Offline)</button>
                <button onClick={()=>{ setAI({providerId:'ollama'}); setShowAI(false)}} className={`h-9 rounded-xl border text-xs font-bold ${ai.providerId==='ollama'?'bg-sky-500 text-black border-sky-500':'bg-white/5 border-white/10 text-white'}`}>OLLAMA (Local)</button>
              </div>
              <div className="mt-3 space-y-2">
                <div className="text-[10px] font-mono tracking-widest text-white/40">OLLAMA URL</div>
                <div className="flex gap-2">
                  <input value={ai.ollamaUrl} onChange={e=>setAI({ollamaUrl:e.target.value})} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono" placeholder="http://localhost:11434" />
                  <button onClick={discoverOllama} disabled={ai.isGenerating} className="h-9 px-3 rounded-full bg-white text-black text-xs font-bold disabled:opacity-50">DISCOVER</button>
                </div>
                {ai.ollamaModels.length>0 && (
                  <div className="flex flex-wrap gap-1">
                    {ai.ollamaModels.map(m=> <span key={m} className="text-[10px] font-mono px-2 py-1 rounded-full bg-sky-500/15 border border-sky-500/20 text-sky-300">{m}</span>)}
                  </div>
                )}
                <div className="text-[11px] leading-relaxed text-zinc-400">Mock funciona offline para demos e testes. Ollama requer instalação local (<code className="bg-white/10 px-1 rounded">ollama serve</code>).</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <input ref={fileRef} type="file" accept=".json,.seedance" className="hidden" onChange={handleLoad} />
      <input ref={importRef} type="file" accept=".txt,.md,.fountain,.csv,.html,.json" className="hidden" onChange={handleImportSource} />
    </div>
  )
}
