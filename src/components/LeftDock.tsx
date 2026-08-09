import { useStore } from '../store/useStore'

const BOARD_META: Record<string, {label:string, short:string, color:string, icon:string}> = {
  STORY:{label:'STORY', short:'ST', color:'#f59e0b', icon:'◧'},
  SCRIPT:{label:'SCRIPT', short:'SC', color:'#38bdf8', icon:'≡'},
  CHAR:{label:'CHAR', short:'CH', color:'#a78bfa', icon:'◉'},
  ENV:{label:'ENV', short:'EN', color:'#34d399', icon:'⬢'},
  TOOLS:{label:'TOOLS', short:'TO', color:'#f472b6', icon:'⚙'},
  DEPTH:{label:'DEPTH', short:'DP', color:'#facc15', icon:'⊞'},
  PROMPT:{label:'PROMPT', short:'PR', color:'#fb923c', icon:'✦'},
}

export function LeftDock(){
  const boards = useStore(s=>s.boards)
  const viewport = useStore(s=>s.viewport)
  const setViewport = useStore(s=>s.setViewport)
  const focusBoard = useStore(s=>s.focusBoard)
  const toggleMinimize = useStore(s=>s.toggleMinimize)
  const project = useStore(s=>s.project)
  const focusedId = useStore(s=>s.selection.focusedBoardId)

  const centerOnBoard = (id:string)=>{
    const b = boards.find(x=>x.id===id)
    if(!b) return
    focusBoard(id)
    // if minimized, restore
    if(b.minimized) toggleMinimize(id)
    // center viewport on board
    const dockW = 64
    const inspectorW = 340
    const topH = 56
    const timelineH = 92
    const vw = window.innerWidth - dockW - inspectorW
    const vh = window.innerHeight - topH - timelineH
    // use current zoom
    const cx = b.x + b.width/2
    const cy = b.y + b.height/2
    const nx = vw/2 - cx * viewport.zoom
    const ny = vh/2 - cy * viewport.zoom
    // clamp a bit? keep simple
    setViewport({ x: nx, y: ny })
  }

  const resetAll = ()=>{
    // distribute boards if needed? just reset viewport
    setViewport({ x:-80, y:-60, zoom:0.92 })
  }

  // sort boards by a fixed order for dock display, not zIndex
  const order: string[] = ['STORY','SCRIPT','CHAR','ENV','TOOLS','DEPTH','PROMPT']
  const sorted = [...boards].sort((a,b)=> order.indexOf(a.boardType) - order.indexOf(b.boardType))

  return (
    <div className="w-[64px] shrink-0 glass-strong border-r border-white/[0.08] flex flex-col items-center py-3 gap-2 no-print z-10 hidden md:flex">
      <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center font-display font-bold text-black text-[13px]">SF</div>
      <div className="text-[8px] font-mono tracking-[0.16em] text-white/30 -mt-1">FORGE</div>

      <div className="w-8 h-px bg-white/10 my-1" />

      <div className="flex flex-col gap-1.5 w-full px-2">
        {sorted.map(b=>{
          const meta = BOARD_META[b.boardType] ?? {label:b.boardType, short:b.boardType.slice(0,2), color:'#fff', icon:'?'}
          const isFocused = focusedId===b.id
          const isMin = b.minimized
          return (
            <button
              key={b.id}
              onClick={()=>centerOnBoard(b.id)}
              onDoubleClick={()=>{
                // double also centers? toggle minimize on double
                // toggleMinimize already in centerOnBoard if min, but here we toggle
              }}
              title={`${meta.label} — ${isMin?'Minimizado':'Visível'} • Clique para focar/centralizar • Duplo-clique no card para expandir`}
              className={`relative w-full flex flex-col items-center gap-1 py-2.5 rounded-xl border transition group ${isFocused ? 'bg-white text-black border-white' : isMin ? 'bg-white/5 border-white/5 text-white/40 hover:text-white hover:bg-white/10' : 'bg-zinc-900 border-white/10 text-zinc-200 hover:bg-zinc-800 hover:border-white/15'}`}
            >
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[12px] border ${isFocused ? 'bg-black text-white border-black/10' : 'bg-white/5 border-white/10'}`} style={{color: isFocused ? '#fff' : meta.color, background: isFocused ? '#000' : `${meta.color}14`}}>{meta.icon}</span>
              <span className="text-[8px] font-mono tracking-[0.12em] font-bold leading-none">{meta.short}</span>
              <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-black/10 border border-black/5 hidden lg:inline-flex" style={{opacity: isFocused?1:0.6}}>{boardKbd(b.boardType)}</span>
              {/* focus indicator */}
              {isFocused && <span className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-amber-500" />}
              {/* minimized dot */}
              {isMin && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />}
              {/* color dot */}
              <span className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full" style={{background: meta.color}} />
            </button>
          )
        })}
      </div>

      <div className="w-8 h-px bg-white/10 my-1" />

      <div className="flex flex-col gap-1 w-full px-2">
        <button onClick={resetAll} className="w-full h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center justify-center gap-0.5" title="Reset View">
          <span className="text-[11px]">⟲</span>
          <span className="text-[7px] font-mono tracking-widest">RESET</span>
        </button>
        <button onClick={()=>useStore.getState().setViewport({x:-80,y:-60,zoom:0.92})} className="w-full h-8 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-[10px] font-mono text-amber-300">
          {Math.round(viewport.zoom*100)}%
        </button>
      </div>

      <div className="mt-auto w-full px-2">
        <div className="rounded-xl bg-black/30 border border-white/5 p-2 flex flex-col gap-1">
          <div className="text-[8px] font-mono tracking-widest text-white/30 text-center">PROJETO</div>
          <div className="text-[10px] font-mono text-center text-white/80 leading-none">{project.frames.length} SHOTS</div>
          <div className="text-[9px] font-mono text-center text-white/40">{project.scenes.length} SCENES</div>
          <div className="h-px bg-white/5 my-1" />
          <div className="flex justify-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500" title={`${project.characters.length} chars`} />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title={`${project.environments.length} envs`} />
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          </div>
        </div>
        <div className="mt-2 text-[7px] font-mono tracking-widest text-white/20 text-center leading-tight">
          ARRASTE<br/>FICHEIROS<br/>P/ IMPORTAR
        </div>
      </div>
    </div>
  )
}

function boardKbd(t:string){
  const map: Record<string,string> = { STORY:'1', SCRIPT:'2', CHAR:'3', ENV:'4', TOOLS:'5', DEPTH:'6', PROMPT:'7' }
  return map[t] ?? ''
}
