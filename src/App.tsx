import { useEffect, useState } from 'react'
import { TopBar } from './components/TopBar'
import { InfiniteCanvas } from './components/InfiniteCanvas'
import { InspectorPanel } from './components/InspectorPanel'
import { TimelineBar } from './components/TimelineBar'
import { ToastStack } from './components/Toast'
import { AnimaticModal } from './components/modals/AnimaticModal'
import { BibleModal } from './components/modals/BibleModal'
import { LeftDock } from './components/LeftDock'
import { useStore } from './store/useStore'
import { validateProject } from './domain/validation'

export default function App(){
  const undo = useStore(s=>s.undo)
  const redo = useStore(s=>s.redo)
  const setUI = useStore(s=>s.setUI)
  const project = useStore(s=>s.project)
  const toast = useStore(s=>s.toast)
  const loadProject = useStore(s=>s.loadProject)
  const addSourceDoc = useStore(s=>s.addSourceDoc)
  const updateCharacter = useStore(s=>s.updateCharacter)
  const updateEnvironment = useStore(s=>s.updateEnvironment)
  const selection = useStore(s=>s.selection)
  const issues = validateProject(project)
  const [isDragging, setIsDragging] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)

  useEffect(()=>{
    const onKey = (e: KeyboardEvent)=>{
      const target = e.target as HTMLElement
      const isInput = target.tagName==='INPUT' || target.tagName==='TEXTAREA' || target.tagName==='SELECT' || target.isContentEditable
      if ((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='z' && !e.shiftKey){
        if(!isInput) { e.preventDefault(); undo() }
      }
      if ((e.ctrlKey||e.metaKey) && (e.key.toLowerCase()==='y' || (e.key.toLowerCase()==='z' && e.shiftKey))){
        if(!isInput) { e.preventDefault(); redo() }
      }
      if (e.key==='Escape'){
        setUI({showAnimatic:false, showBible:false})
      }
      if (!isInput && ['1','2','3','4','5','6','7'].includes(e.key)){
        const map: Record<string,string> = {'1':'board-story','2':'board-script','3':'board-char','4':'board-env','5':'board-tools','6':'board-depth','7':'board-prompt'}
        const id = map[e.key]
        if(id) useStore.getState().focusBoard(id)
      }
    }
    window.addEventListener('keydown', onKey)
    return ()=> window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  const handleDragEnter = (e: React.DragEvent)=>{
    e.preventDefault()
    setDragCounter(c=>c+1)
    setIsDragging(true)
  }
  const handleDragOver = (e: React.DragEvent)=>{
    e.preventDefault()
  }
  const handleDragLeave = (e: React.DragEvent)=>{
    e.preventDefault()
    setDragCounter(c=>{
      const n = c-1
      if(n<=0) setIsDragging(false)
      return Math.max(0,n)
    })
  }
  const handleDrop = async (e: React.DragEvent)=>{
    e.preventDefault()
    setIsDragging(false)
    setDragCounter(0)
    const files = Array.from(e.dataTransfer.files)
    if(!files.length) return
    for(const file of files){
      const name = file.name
      const lower = name.toLowerCase()
      const isImage = file.type.startsWith('image/')
      if (isImage) {
        // handle image: attach to selected character/environment or create source doc
        const reader = new FileReader()
        const dataUrl: string = await new Promise(res=>{
          reader.onload = ()=> res(reader.result as string)
          reader.readAsDataURL(file)
        })
        const selCharId = selection.selectedCharacterId ?? project.characters[0]?.id
        const selEnvId = selection.selectedEnvironmentId ?? project.environments[0]?.id
        // decide: if character lock missing maybe prioritize char
        // if project has characters, attach to first/selected char's references
        if (selCharId) {
          const char = project.characters.find(c=>c.id===selCharId)
          if (char) {
            updateCharacter(char.id, { references: [...(char.references||[]), dataUrl] })
            toast(`Imagem adicionada a ${char.name}`, 'success')
            continue
          }
        }
        if (selEnvId) {
          const env = project.environments.find(en=>en.id===selEnvId)
          if (env) {
            updateEnvironment(env.id, { references: [...(env.references||[]), dataUrl] })
            toast(`Imagem adicionada a ${env.name}`, 'success')
            continue
          }
        }
        // fallback: source doc
        addSourceDoc({ name, type: 'IMAGE', content: dataUrl })
        toast(`Imagem importada: ${name}`, 'success')
        continue
      }

      if (lower.endsWith('.seedance') || lower.endsWith('.json')) {
        try{
          const text = await file.text()
          const data = JSON.parse(text)
          const proj = data.project ?? data
          if (proj.title && proj.scenes) {
            // looks like project
            loadProject(proj, data.boards)
            toast(`Projeto carregado: ${name}`, 'success')
          } else {
            // generic json source
            addSourceDoc({ name, type: file.name.split('.').pop()?.toUpperCase() ?? 'JSON', content: text })
            toast(`JSON importado: ${name}`, 'success')
          }
        } catch(err:any){
          toast(`Falha ao ler ${name}: ${err.message}`, 'error')
        }
        continue
      }

      // text-like files: fountain, txt, md, csv, html
      try{
        const text = await file.text()
        const ext = file.name.split('.').pop()?.toUpperCase() ?? 'TXT'
        addSourceDoc({ name, type: ext, content: text })
        toast(`Fonte importada: ${name}`, 'success')
        // if fountain, hint about extraction
        if (ext==='FOUNTAIN' || text.includes('INT.') || text.includes('EXT.')) {
          // could auto-parse but leave to user via SCRIPT board extract
        }
      } catch(err:any){
        toast(`Falha ${name}: ${err.message}`, 'error')
      }
    }
  }

  return (
    <div
      className="h-screen w-screen flex flex-col bg-[#09090b] text-zinc-100 overflow-hidden relative"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <TopBar />
      {issues.length>0 && (
        <div className="h-7 shrink-0 bg-amber-500/10 border-b border-amber-500/20 flex items-center px-3 gap-2 overflow-auto no-print">
          <span className="text-[10px] font-mono tracking-widest font-bold text-amber-300">VALIDATION</span>
          <span className="text-[11px] text-amber-200/80 truncate">
            {issues.slice(0,3).map(i=>i.message).join(' • ')} {issues.length>3 ? `+${issues.length-3} more` : ''}
          </span>
          <span className="ml-auto text-[10px] font-mono bg-amber-500 text-black px-2 py-0.5 rounded-full font-bold shrink-0">{issues.length}</span>
        </div>
      )}
      <div className="flex-1 flex min-h-0">
        <LeftDock />
        <div className="flex-1 relative min-w-0">
          <InfiniteCanvas />
        </div>
        <InspectorPanel />
      </div>
      <TimelineBar />

      {/* drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="glass-strong rounded-[20px] border-2 border-dashed border-amber-500/40 p-8 max-w-[520px] w-[90%] text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center mx-auto text-black text-xl">⬆</div>
            <div className="mt-4 font-display font-bold tracking-widest text-lg">SOLTE PARA IMPORTAR</div>
            <div className="mt-1 text-sm text-zinc-300 leading-relaxed">Arraste <b>.seedance</b> para carregar projeto • <b>Fountain / TXT / MD / CSV</b> para fonte • <b>Imagens</b> para referências do personagem/ambiente selecionado</div>
            <div className="mt-4 flex flex-wrap justify-center gap-2 text-[10px] font-mono">
              <span className="px-2.5 py-1 rounded-full bg-white text-black font-bold">.SEEDANCE</span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/10">.FOUNTAIN</span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/10">.JSON</span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/10">.CSV</span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/10">PNG / JPG / WEBP</span>
            </div>
            <div className="mt-3 text-[11px] font-mono text-white/40">CTRL+SCROLL para zoom • Duplo-clique no header para expandir card</div>
          </div>
        </div>
      )}

      <AnimaticModal />
      <BibleModal />
      <ToastStack />

      <div className="print-only p-8 bg-white text-black">
        <h1 className="text-2xl font-bold">{project.title}</h1>
        <p className="text-sm text-zinc-600">{project.director} • {project.aspectRatio} • {project.fps}fps</p>
        <div className="mt-6 space-y-4">
          {project.scenes.map(sc=>{
            const frames = project.frames.filter(f=>f.sceneId===sc.id)
            return (
              <div key={sc.id} className="border border-zinc-200 rounded-xl p-4">
                <div className="font-bold">{sc.title}</div>
                {frames.map(f=>(
                  <div key={f.id} className="mt-2 text-sm border-t border-zinc-100 pt-2">
                    <div className="font-mono text-xs">{f.shotType} {f.lens} {f.movement} {f.duration}s</div>
                    <div>{f.action}</div>
                    {f.dialogue && <div className="italic">“{f.dialogue}”</div>}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
