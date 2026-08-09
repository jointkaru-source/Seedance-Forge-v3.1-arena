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
  const [showFile, setShowFile] = useState(false)
  const [showExport, setShowExport] = useState(false)

  const handleSave = ()=>{
    const content = toSeedance(project, boards)
    downloadFile(content, `${project.title.replace(/\s+/g,'_')}.seedance`, 'application/json')
    // @ts-ignore
    if ((window as any).__TAURI__?.core?.invoke) {
      // @ts-ignore
      (window as any).__TAURI__.core.invoke('save_project_file', { path: `${project.title}.seedance`, content }).catch(()=>{})
    }
    toast('Projeto salvo (.seedance)', 'success')
    setShowFile(false)
  }
  const handleExportJSON = ()=>{
    downloadFile(toJSON(project), `${project.title.replace(/\s+/g,'_')}.json`, 'application/json')
    toast('JSON exportado', 'success')
    setShowExport(false)
  }
  const handleExportCSV = ()=>{
    downloadFile(toCSV(project), `${project.title.replace(/\s+/g,'_')}_shots.csv`, 'text/csv')
    toast('CSV exportado', 'success')
    setShowExport(false)
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
    setShowFile(false)
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
    setShowFile(false)
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
    <div className="h-[56px] shrink-0 glass-strong border-b border-white/[0.08] flex items-center gap-2 px-2 lg:px-3 no-print relative z-20">
      {/* LEFT: brand + project */}
      <div className="flex items-center gap-2 lg:gap-3 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center font-display font-bold text-black text-[14px] tracking-tighter shrink-0">SF</div>
        <div className="hidden sm:block leading-none">
          <div className="font-display font-bold text-[12px] tracking-widest leading-none">SEEDANCE FORGE</div>
          <div className="font-mono text-[9px] tracking-[0.18em] text-white/40">v3.1 • PRE-PRODUCTION OS</div>
        </div>
        <div className="hidden lg:block h-7 w-px bg-white/10 mx-1" />
      </div>

      {/* CENTER-LEFT: project pill */}
      <div className="hidden md:flex items-center gap-1 bg-white/[0.04] border border-white/10 rounded-full p-1 shrink-0">
        <input value={project.title} onChange={e=>setProjectMeta({title:e.target.value})} className="bg-transparent border-0 rounded-full px-3 py-1 text-xs font-mono tracking-widest text-white w-[160px] xl:w-[190px] focus:outline-none placeholder:text-white/30" placeholder="TÍTULO DO PROJETO" />
        <span className="w-px h-5 bg-white/10 hidden xl:block" />
        <input value={project.director ?? ''} onChange={e=>setProjectMeta({director:e.target.value})} placeholder="Director" className="hidden xl:block bg-transparent border-0 rounded-full px-2 py-1 text-xs text-white/80 w-[120px] focus:outline-none placeholder:text-white/30" />
        <span className="hidden xl:block w-px h-5 bg-white/10" />
        <select value={project.aspectRatio} onChange={e=>setProjectMeta({aspectRatio: e.target.value as any})} className="bg-zinc-900 border border-white/10 rounded-full px-2 py-1 text-[11px] font-mono hidden lg:block focus:outline-none">
          {ASPECT_RATIOS.map(ar=> <option key={ar} value={ar}>{ar}</option>)}
        </select>
        <div className="hidden lg:flex items-center gap-1 bg-black/20 border border-white/5 rounded-full px-2 py-1 ml-1">
          <span className="text-[9px] font-mono text-white/40">FPS</span>
          <input type="number" value={project.fps} onChange={e=>setProjectMeta({fps: parseInt(e.target.value)||24})} className="w-10 bg-transparent text-xs font-mono text-white focus:outline-none" />
        </div>
      </div>

      {/* undo/redo */}
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={undo} title="Undo (Ctrl+Z)" className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition">↺</button>
        <button onClick={redo} title="Redo (Ctrl+Shift+Z)" className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition">↻</button>
      </div>

      <div className="hidden sm:block h-6 w-px bg-white/10 mx-1 shrink-0" />

      {/* FILE + SAVE group */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button onClick={handleSave} className="h-8 px-4 rounded-full bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold tracking-widest shadow-[0_0_0_1px_rgba(245,158,11,0.4),0_4px_12px_rgba(245,158,11,0.25)]">SAVE</button>
        <div className="relative">
          <button onClick={()=>setShowFile(v=>!v)} className="h-8 px-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-mono tracking-widest flex items-center gap-1.5">
            FILE <span className="text-[10px] opacity-50">▾</span>
          </button>
          {showFile && (
            <div className="absolute left-0 top-10 w-[240px] glass-strong rounded-2xl border border-white/10 p-2 shadow-2xl z-50">
              <div className="text-[10px] font-mono tracking-widest text-white/40 px-2 py-1">PROJECT</div>
              <button onClick={handleSave} className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-xs flex items-center gap-2"><span className="w-6 h-6 rounded-lg bg-amber-500 text-black flex items-center justify-center text-xs">⬇</span> Save .seedance</button>
              <button onClick={()=>fileRef.current?.click()} className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-xs flex items-center gap-2"><span className="w-6 h-6 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">↗</span> Load .seedance / JSON</button>
              <button onClick={()=>importRef.current?.click()} className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-xs flex items-center gap-2"><span className="w-6 h-6 rounded-lg bg-sky-500/15 border border-sky-500/20 text-sky-300 flex items-center justify-center text-xs">＋</span> Import Source (Fountain/TXT/MD)</button>
              <div className="h-px bg-white/10 my-1" />
              <div className="text-[10px] font-mono tracking-widest text-white/40 px-2 py-1">DRAG & DROP</div>
              <div className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] leading-relaxed text-zinc-400">Arraste ficheiros ou imagens diretamente para o canvas. Imagens vão para o personagem/ambiente selecionado.</div>
            </div>
          )}
        </div>
        {/* mobile title input when pill hidden */}
        <input value={project.title} onChange={e=>setProjectMeta({title:e.target.value})} className="md:hidden bg-white/[0.06] border border-white/10 rounded-full px-3 py-1.5 text-xs font-mono tracking-widest text-white w-[140px] focus:outline-none" placeholder="Título" />
      </div>

      {/* spacer */}
      <div className="flex-1 min-w-0 hidden lg:block" />

      {/* EXPORT group */}
      <div className="hidden lg:flex items-center gap-1 shrink-0">
        <div className="relative">
          <button onClick={()=>setShowExport(v=>!v)} className="h-8 px-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono tracking-widest text-white flex items-center gap-1.5">EXPORT <span className="opacity-50">▾</span></button>
          {showExport && (
            <div className="absolute right-0 top-10 w-[200px] glass-strong rounded-2xl border border-white/10 p-2 shadow-2xl z-50">
              <button onClick={handleExportJSON} className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-xs">Export JSON</button>
              <button onClick={handleExportCSV} className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-xs">Export CSV (shots)</button>
              <button onClick={()=>{ window.print(); setShowExport(false)}} className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-xs">Print / PDF</button>
            </div>
          )}
        </div>
        <div className="hidden xl:flex items-center gap-1 ml-1">
          <button onClick={handleExportJSON} title="Export JSON" className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-[11px]">JS</button>
          <button onClick={handleExportCSV} title="Export CSV" className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-[11px]">CSV</button>
          <button onClick={()=>window.print()} title="Print PDF" className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-[11px]">PDF</button>
        </div>
      </div>

      <div className="hidden md:block h-6 w-px bg-white/10 mx-1 shrink-0" />

      {/* VIEW + AI */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button onClick={()=>setUI({showBible:true})} className="hidden sm:inline-flex h-8 px-3 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold tracking-widest">BIBLE</button>
        <button onClick={()=>setUI({showAnimatic:true})} className="h-8 px-3 sm:px-4 rounded-full bg-white hover:bg-zinc-100 text-black text-xs font-bold tracking-widest inline-flex items-center gap-1.5 shadow"> <span className="hidden sm:inline">ANIMATIC</span> <span className="text-[13px]">▶</span></button>

        <div className="relative ml-1 pl-2 border-l border-white/10 flex items-center">
          <button onClick={()=>setShowAI(v=>!v)} className="flex items-center gap-2 h-8 px-3 rounded-full bg-zinc-900 border border-white/10 hover:bg-zinc-800 transition">
            <div className={`w-2 h-2 rounded-full ${ai.providerId==='mock'?'bg-emerald-400':'bg-sky-400'} animate-pulse`} />
            <span className="hidden xl:inline text-[10px] font-mono tracking-widest text-white/80">{ai.providerId==='mock'?'MOCK':'OLLAMA'}</span>
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
                <div className="text-[11px] leading-relaxed text-zinc-400">Mock offline para demos. Ollama requer <code className="bg-white/10 px-1 rounded">ollama serve</code>.</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <input ref={fileRef} type="file" accept=".json,.seedance" className="hidden" onChange={handleLoad} />
      <input ref={importRef} type="file" accept=".txt,.md,.fountain,.csv,.html,.json,image/*" className="hidden" onChange={handleImportSource} />

      {/* click outside to close menus */}
      {(showFile||showAI||showExport) && <div className="fixed inset-0 z-10" onClick={()=>{setShowFile(false); setShowAI(false); setShowExport(false)}} />}
    </div>
  )
}
