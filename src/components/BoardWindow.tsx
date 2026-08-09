import React, { useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import type { BoardWindowState } from '../types/project'

const BOARD_TITLES: Record<string, {label:string, kbd:string, color:string}> = {
  STORY:{label:'STORY-BOARD', kbd:'1', color:'#f59e0b'},
  SCRIPT:{label:'SCRIPT-BOARD', kbd:'2', color:'#38bdf8'},
  CHAR:{label:'CHAR-BOARD', kbd:'3', color:'#a78bfa'},
  ENV:{label:'ENV-BOARD', kbd:'4', color:'#34d399'},
  TOOLS:{label:'TOOLS-BOARD', kbd:'5', color:'#f472b6'},
  DEPTH:{label:'DEPTH-BOARD', kbd:'6', color:'#facc15'},
  PROMPT:{label:'PROMPT-BOARD', kbd:'7', color:'#fb923c'},
}

export function BoardWindow({ win, children, viewport }: { win: BoardWindowState, children: React.ReactNode, viewport: {x:number,y:number,zoom:number} }){
  const moveBoard = useStore(s=>s.moveBoard)
  const focusBoard = useStore(s=>s.focusBoard)
  const toggleMinimize = useStore(s=>s.toggleMinimize)
  const focused = useStore(s=>s.selection.focusedBoardId===win.id)
  const ref = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<{dx:number, dy:number, sx:number, sy:number}|null>(null)

  const meta = BOARD_TITLES[win.boardType] ?? {label:win.boardType, kbd:'', color:'#fff'}

  // world -> screen
  const screenX = win.x * viewport.zoom + viewport.x
  const screenY = win.y * viewport.zoom + viewport.y
  const w = win.width * viewport.zoom
  const h = win.minimized ? 44 * viewport.zoom : win.height * viewport.zoom

  const onPointerDown = (e: React.PointerEvent)=>{
    // only drag from header
    const target = e.target as HTMLElement
    if (target.closest('[data-no-drag]')) return
    focusBoard(win.id)
    const sx = e.clientX
    const sy = e.clientY
    setDrag({ dx: win.x, dy: win.y, sx, sy })
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent)=>{
    if (!drag) return
    const dxScreen = e.clientX - drag.sx
    const dyScreen = e.clientY - drag.sy
    const dxWorld = dxScreen / viewport.zoom
    const dyWorld = dyScreen / viewport.zoom
    moveBoard(win.id, drag.dx + dxWorld, drag.dy + dyWorld)
  }
  const onPointerUp = (e: React.PointerEvent)=>{
    setDrag(null)
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  }

  return (
    <div
      ref={ref}
      onMouseDown={()=>focusBoard(win.id)}
      className={`absolute select-none flex flex-col rounded-[14px] overflow-hidden border ${focused?'board-focus border-amber-500/30':'board-shadow border-white/[0.06]'}`}
      style={{
        left: screenX,
        top: screenY,
        width: w,
        height: h,
        zIndex: win.zIndex,
        background: 'rgba(14,14,16,0.96)',
        backdropFilter:'blur(18px) saturate(1.1)',
      }}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="h-[44px] shrink-0 flex items-center gap-3 px-3 cursor-grab active:cursor-grabbing border-b border-white/[0.06] relative"
        style={{ background: focused ? 'linear-gradient(180deg, rgba(245,158,11,0.10), transparent)' : 'linear-gradient(180deg, rgba(255,255,255,0.04), transparent)'}}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{background: meta.color, boxShadow:`0 0 8px ${meta.color}80`}} />
          <span className="font-mono text-[11px] tracking-[0.14em] font-semibold text-zinc-100">{meta.label}</span>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-zinc-400 border border-white/10">{meta.kbd}</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <button data-no-drag onClick={()=>toggleMinimize(win.id)} className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition">
            <span className="text-[14px] leading-none">{win.minimized ? '▢' : '—'}</span>
          </button>
          <div className="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/20 hidden sm:flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          </div>
        </div>
        {/* focus glow line */}
        {focused && <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />}
      </div>

      {!win.minimized && (
        <div className="flex-1 min-h-0 overflow-hidden bg-[#0f0f11] relative">
          <div className="absolute inset-0 overflow-auto custom-scroll">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}
