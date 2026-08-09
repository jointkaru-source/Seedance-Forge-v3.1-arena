import React, { useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import type { BoardWindowState } from '../types/project'

const BOARD_TITLES: Record<string, {label:string, kbd:string, color:string, icon:string}> = {
  STORY:{label:'STORY-BOARD', kbd:'1', color:'#f59e0b', icon:'◧'},
  SCRIPT:{label:'SCRIPT-BOARD', kbd:'2', color:'#38bdf8', icon:'≡'},
  CHAR:{label:'CHAR-BOARD', kbd:'3', color:'#a78bfa', icon:'◉'},
  ENV:{label:'ENV-BOARD', kbd:'4', color:'#34d399', icon:'⬢'},
  TOOLS:{label:'TOOLS-BOARD', kbd:'5', color:'#f472b6', icon:'⚙'},
  DEPTH:{label:'DEPTH-BOARD', kbd:'6', color:'#facc15', icon:'⊞'},
  PROMPT:{label:'PROMPT-BOARD', kbd:'7', color:'#fb923c', icon:'✦'},
}

export function BoardWindow({ win, children, viewport }: { win: BoardWindowState, children: React.ReactNode, viewport: {x:number,y:number,zoom:number} }){
  const moveBoard = useStore(s=>s.moveBoard)
  const resizeBoard = useStore(s=>s.resizeBoard)
  const focusBoard = useStore(s=>s.focusBoard)
  const toggleMinimize = useStore(s=>s.toggleMinimize)
  const setViewport = useStore(s=>s.setViewport)
  const focused = useStore(s=>s.selection.focusedBoardId===win.id)
  const ref = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<{dx:number, dy:number, sx:number, sy:number}|null>(null)
  const [resizing, setResizing] = useState<{w:number,h:number,sx:number,sy:number}|null>(null)
  const [prevSize, setPrevSize] = useState<{w:number,h:number,x:number,y:number}|null>(null)

  const meta = BOARD_TITLES[win.boardType] ?? {label:win.boardType, kbd:'', color:'#fff', icon:'▭'}

  const screenX = win.x * viewport.zoom + viewport.x
  const screenY = win.y * viewport.zoom + viewport.y
  const w = win.width * viewport.zoom
  const h = win.minimized ? 44 * viewport.zoom : win.height * viewport.zoom

  const onPointerDown = (e: React.PointerEvent)=>{
    const target = e.target as HTMLElement
    if (target.closest('[data-no-drag]') || target.closest('[data-resize]')) return
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

  const onResizeDown = (e: React.PointerEvent)=>{
    e.stopPropagation()
    focusBoard(win.id)
    setResizing({ w: win.width, h: win.height, sx: e.clientX, sy: e.clientY })
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onResizeMove = (e: React.PointerEvent)=>{
    if(!resizing) return
    const dx = (e.clientX - resizing.sx) / viewport.zoom
    const dy = (e.clientY - resizing.sy) / viewport.zoom
    const nw = Math.max(320, Math.min(1400, resizing.w + dx))
    const nh = Math.max(240, Math.min(900, resizing.h + dy))
    resizeBoard(win.id, nw, nh)
  }
  const onResizeUp = (e: React.PointerEvent)=>{
    setResizing(null)
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  }

  const handleDoubleClick = ()=>{
    if (win.minimized) {
      toggleMinimize(win.id)
      return
    }
    // toggle maximize / restore
    if (prevSize) {
      // restore
      moveBoard(win.id, prevSize.x, prevSize.y)
      resizeBoard(win.id, prevSize.w, prevSize.h)
      setPrevSize(null)
      // center viewport maybe? keep as is
    } else {
      // save current
      setPrevSize({ w: win.width, h: win.height, x: win.x, y: win.y })
      // compute maximized size in world coords (85% of viewport screen)
      const vw = window.innerWidth
      const vh = window.innerHeight
      // account for left dock (64) and inspector (340)
      const availW = vw - 64 - 340 - 32
      const availH = vh - 56 - 92 - 32 // topbar + timeline
      const targetW = Math.min(1100, Math.max(560, availW / viewport.zoom))
      const targetH = Math.min(720, Math.max(420, availH / viewport.zoom))
      // center in viewport
      const centerScreenX = 64 + availW/2
      const centerScreenY = 56 + availH/2
      // world pos to make board centered
      const targetX = (centerScreenX - viewport.x) / viewport.zoom - targetW/2
      const targetY = (centerScreenY - viewport.y) / viewport.zoom - targetH/2
      // also slightly animate viewport to center board? we can also center viewport on board
      // move board to centered position
      moveBoard(win.id, targetX, targetY)
      resizeBoard(win.id, targetW, targetH)
      focusBoard(win.id)
      // optionally ensure board is visible: adjust viewport if needed
      // center viewport on board
      const boardCenterWorldX = targetX + targetW/2
      const boardCenterWorldY = targetY + targetH/2
      const desiredViewportX = vw/2 - boardCenterWorldX * viewport.zoom
      const desiredViewportY = vh/2 - boardCenterWorldY * viewport.zoom
      // smooth transition? immediate
      // we won't auto-pan viewport aggressively; just keep board position centered, viewport stays - so board already centered via calculation
    }
  }

  return (
    <div
      ref={ref}
      onMouseDown={()=>focusBoard(win.id)}
      className={`absolute select-none flex flex-col rounded-[14px] overflow-hidden border ${focused?'board-focus border-amber-500/30':'board-shadow border-white/[0.06]'} ${resizing?'select-none':''}`}
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
        onDoubleClick={handleDoubleClick}
        title="Arraste para mover • Duplo-clique para expandir/restaurar"
        className="h-[44px] shrink-0 flex items-center gap-3 px-3 cursor-grab active:cursor-grabbing border-b border-white/[0.06] relative"
        style={{ background: focused ? 'linear-gradient(180deg, rgba(245,158,11,0.10), transparent)' : 'linear-gradient(180deg, rgba(255,255,255,0.04), transparent)'}}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{background: meta.color, boxShadow:`0 0 8px ${meta.color}80`}} />
          <span className="hidden sm:inline-flex w-7 h-7 rounded-lg bg-white/5 border border-white/10 items-center justify-center text-[11px]" style={{color: meta.color}}>{meta.icon}</span>
          <span className="font-mono text-[11px] tracking-[0.14em] font-semibold text-zinc-100">{meta.label}</span>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-zinc-400 border border-white/10">{meta.kbd}</span>
          {prevSize && <span className="hidden sm:inline-flex text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-amber-500 text-black font-bold">EXPANDIDO</span>}
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="hidden lg:inline text-[10px] font-mono text-white/20 mr-1">DUPLO-CLIQUE ↔ EXPANDIR</span>
          <button data-no-drag onClick={()=>toggleMinimize(win.id)} className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition" title={win.minimized ? 'Restaurar' : 'Minimizar'}>
            <span className="text-[14px] leading-none">{win.minimized ? '▢' : '—'}</span>
          </button>
          <button data-no-drag onClick={handleDoubleClick} className="hidden sm:flex w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/10 border border-white/10 items-center justify-center text-zinc-400 hover:text-zinc-100" title="Expandir / Restaurar (duplo clique)">
            <span className="text-[11px]">{prevSize ? '▣' : '⛶'}</span>
          </button>
          <div className="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/20 hidden sm:flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          </div>
        </div>
        {focused && <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />}
      </div>

      {!win.minimized && (
        <div className="flex-1 min-h-0 overflow-hidden bg-[#0f0f11] relative">
          <div className="absolute inset-0 overflow-auto custom-scroll">
            {children}
          </div>
          {/* resize handle */}
          <div
            data-resize
            onPointerDown={onResizeDown}
            onPointerMove={onResizeMove}
            onPointerUp={onResizeUp}
            className="absolute right-1 bottom-1 w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center cursor-nwse-resize backdrop-blur z-10"
            title="Arraste para redimensionar"
          >
            <span className="text-[10px] text-white/50 leading-none">⤡</span>
          </div>
        </div>
      )}
    </div>
  )
}
