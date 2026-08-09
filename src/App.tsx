import { useEffect } from 'react'
import { TopBar } from './components/TopBar'
import { InfiniteCanvas } from './components/InfiniteCanvas'
import { InspectorPanel } from './components/InspectorPanel'
import { TimelineBar } from './components/TimelineBar'
import { ToastStack } from './components/Toast'
import { AnimaticModal } from './components/modals/AnimaticModal'
import { BibleModal } from './components/modals/BibleModal'
import { useStore } from './store/useStore'
import { validateProject } from './domain/validation'

export default function App(){
  const undo = useStore(s=>s.undo)
  const redo = useStore(s=>s.redo)
  const setUI = useStore(s=>s.setUI)
  const project = useStore(s=>s.project)
  const issues = validateProject(project)

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
      // board shortcuts 1-7 focus
      if (!isInput && ['1','2','3','4','5','6','7'].includes(e.key)){
        const map: Record<string,string> = {'1':'board-story','2':'board-script','3':'board-char','4':'board-env','5':'board-tools','6':'board-depth','7':'board-prompt'}
        const id = map[e.key]
        if(id) useStore.getState().focusBoard(id)
      }
    }
    window.addEventListener('keydown', onKey)
    return ()=> window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  return (
    <div className="h-screen w-screen flex flex-col bg-[#09090b] text-zinc-100 overflow-hidden">
      <TopBar />
      {/* validation strip */}
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
        <div className="flex-1 relative min-w-0">
          <InfiniteCanvas />
        </div>
        <InspectorPanel />
      </div>
      <TimelineBar />

      <AnimaticModal />
      <BibleModal />
      <ToastStack />

      {/* print bible / shotlist */}
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
