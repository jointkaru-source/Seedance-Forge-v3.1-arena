import React, { useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import { BoardWindow } from './BoardWindow'
import { StoryboardBoard } from './boards/StoryboardBoard'
import { ScriptBoard } from './boards/ScriptBoard'
import { CharBoard } from './boards/CharBoard'
import { EnvBoard } from './boards/EnvBoard'
import { ToolsBoard } from './boards/ToolsBoard'
import { DepthBoard } from './boards/DepthBoard'
import { PromptBoard } from './boards/PromptBoard'

const CANVAS_W = 6000
const CANVAS_H = 5000

export function InfiniteCanvas(){
  const viewport = useStore(s=>s.viewport)
  const setViewport = useStore(s=>s.setViewport)
  const boards = useStore(s=>s.boards)
  const containerRef = useRef<HTMLDivElement>(null)
  const [panning, setPanning] = useState<{sx:number, sy:number, vx:number, vy:number}|null>(null)

  const onPointerDown = (e: React.PointerEvent)=>{
    const target = e.target as HTMLElement
    // don't pan if clicking board or controls
    if (target.closest('[data-board]') || target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('select')) return
    setPanning({ sx:e.clientX, sy:e.clientY, vx:viewport.x, vy:viewport.y })
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent)=>{
    if (!panning) return
    const dx = e.clientX - panning.sx
    const dy = e.clientY - panning.sy
    setViewport({ x: panning.vx + dx, y: panning.vy + dy })
  }
  const onPointerUp = (e: React.PointerEvent)=>{
    setPanning(null)
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  }
  const onWheel = (e: React.WheelEvent)=>{
    // cursor-centered zoom
    e.preventDefault()
    const delta = -e.deltaY * 0.0015
    const newZoom = Math.min(2.5, Math.max(0.3, viewport.zoom * (1+delta)))
    if (newZoom===viewport.zoom) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) { setViewport({zoom:newZoom}); return }
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    // world point under cursor before
    const wx = (cx - viewport.x) / viewport.zoom
    const wy = (cy - viewport.y) / viewport.zoom
    const nx = cx - wx * newZoom
    const ny = cy - wy * newZoom
    setViewport({ zoom: newZoom, x: nx, y: ny })
  }

  const zoomIn = ()=>{
    const nz = Math.min(2.5, viewport.zoom*1.18)
    setViewport({zoom:nz})
  }
  const zoomOut = ()=>{
    const nz = Math.max(0.3, viewport.zoom*0.85)
    setViewport({zoom:nz})
  }
  const resetView = ()=> setViewport({ x:-80, y:-60, zoom:0.92 })

  // grid pattern transform
  const gridSize = 28 * viewport.zoom

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onWheel={onWheel}
      className="absolute inset-0 overflow-hidden bg-[#08080a] select-none"
      style={{ cursor: panning ? 'grabbing' : 'grab' }}
    >
      {/* base */}
      <div className="absolute inset-0" style={{ background:'radial-gradient(1400px 800px at 30% 0%, rgba(245,158,11,0.08), transparent 60%), radial-gradient(1000px 600px at 90% 80%, rgba(56,189,248,0.06), transparent 60%), linear-gradient(180deg, #0a0a0c, #08080a)'}} />
      {/* grid */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:`linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize:`${gridSize}px ${gridSize}px`,
          backgroundPosition:`${viewport.x}px ${viewport.y}px`,
        }}
      />
      {/* world container */}
      <div
        className="absolute"
        style={{
          left: viewport.x,
          top: viewport.y,
          width: CANVAS_W * viewport.zoom,
          height: CANVAS_H * viewport.zoom,
          transformOrigin:'0 0',
        }}
      >
        {/* canvas border hint */}
        <div className="absolute inset-0 rounded-[24px] border border-white/[0.04] pointer-events-none" />
        <div className="absolute -top-6 left-4 font-mono text-[10px] tracking-[0.2em] text-white/20">CANVAS 6000×5000 • SEEDANCE FORGE v3.1</div>
      </div>

      {/* boards layered above world transform? We position via viewport math inside BoardWindow */}
      {boards.map(b=>(
        <div key={b.id} data-board>
          <BoardWindow win={b} viewport={viewport}>
            {b.boardType==='STORY' && <StoryboardBoard />}
            {b.boardType==='SCRIPT' && <ScriptBoard />}
            {b.boardType==='CHAR' && <CharBoard />}
            {b.boardType==='ENV' && <EnvBoard />}
            {b.boardType==='TOOLS' && <ToolsBoard />}
            {b.boardType==='DEPTH' && <DepthBoard />}
            {b.boardType==='PROMPT' && <PromptBoard />}
          </BoardWindow>
        </div>
      ))}

      {/* floating controls */}
      <div className="absolute bottom-6 left-6 flex items-center gap-2 no-print">
        <div className="glass rounded-full p-1 flex items-center gap-1 shadow-xl">
          <button onClick={zoomOut} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white">−</button>
          <div className="px-3 font-mono text-xs tracking-widest text-white/80">{Math.round(viewport.zoom*100)}%</div>
          <button onClick={zoomIn} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white">+</button>
        </div>
        <button onClick={resetView} className="glass rounded-full px-4 h-9 text-xs font-mono tracking-widest text-white/80 hover:text-white border border-white/10">RESET VIEW</button>
        <div className="hidden md:flex items-center gap-2 ml-2 text-[10px] font-mono tracking-widest text-white/30">
          <span>DRAG CANVAS • SCROLL ZOOM • CLICK BOARD TO FOCUS</span>
        </div>
      </div>

      {/* minimap */}
      <div className="absolute top-4 right-[340px] hidden xl:block no-print">
        <div className="glass rounded-xl p-2 w-[160px]">
          <div className="text-[10px] font-mono tracking-widest text-white/40 mb-1.5">WORLD MAP</div>
          <div className="relative bg-black/40 rounded-lg overflow-hidden border border-white/10" style={{ height: 110 }}>
            <div className="absolute inset-1">
              {boards.map(b=>(
                <div key={b.id} className="absolute rounded-[2px] border" style={{
                  left: `${(b.x/CANVAS_W)*100}%`,
                  top: `${(b.y/CANVAS_H)*100}%`,
                  width: `${(b.width/CANVAS_W)*100}%`,
                  height: `${(b.height/CANVAS_H)*100}%`,
                  background: b.boardType==='STORY'? 'rgba(245,158,11,0.35)': 'rgba(255,255,255,0.12)',
                  borderColor:'rgba(255,255,255,0.18)'
                }} />
              ))}
              <div className="absolute border border-amber-400/50 bg-amber-400/10" style={{
                left: `${(-viewport.x/viewport.zoom / CANVAS_W)*100}%`,
                top: `${(-viewport.y/viewport.zoom / CANVAS_H)*100}%`,
                width: `${( (window.innerWidth / viewport.zoom)/CANVAS_W)*100}%`,
                height: `${( (window.innerHeight / viewport.zoom)/CANVAS_H)*100}%`,
              }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
