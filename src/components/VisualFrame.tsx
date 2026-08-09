import type { ShotType, AspectRatio } from '../types/project'

export function VisualFrame({ shotType, aspectRatio, palette, letterbox=true }: { shotType: ShotType, aspectRatio: AspectRatio, palette?: string[], letterbox?: boolean }){
  const pal = palette && palette.length ? palette : ['#2a2a2e','#c9a86a','#6b7f8c']
  // map shot type to subject scale & horizon
  const cfg: Record<ShotType, { scale: number, y: number, horizon: number }> = {
    ELS:{scale:0.12, y:68, horizon:62},
    LS:{scale:0.22, y:66, horizon:60},
    MLS:{scale:0.32, y:64, horizon:58},
    MS:{scale:0.42, y:64, horizon:56},
    MCU:{scale:0.55, y:62, horizon:54},
    CU:{scale:0.75, y:58, horizon:50},
    ECU:{scale:0.95, y:55, horizon:48},
    OTS:{scale:0.45, y:62, horizon:55},
    POV:{scale:0.18, y:66, horizon:60},
  }
  const c = cfg[shotType] ?? cfg.MS
  const arMap: Record<AspectRatio, number> = {'16:9':16/9,'2.39:1':2.39,'2:1':2,'4:3':4/3,'9:16':9/16,'1:1':1}
  const ar = arMap[aspectRatio] ?? 2.39
  const vbW = 400
  const vbH = Math.round(vbW / ar)
  // svg with gradients, subject silhouette, rule of thirds, horizon
  return (
    <div className="w-full bg-zinc-900 overflow-hidden rounded-[10px] border border-white/[0.06]" style={{ aspectRatio: `${ar}` }}>
      <svg viewBox={`0 0 ${vbW} ${vbH}`} width="100%" height="100%" preserveAspectRatio="xMidYMid slice" className="block">
        <defs>
          <radialGradient id={`sky-${shotType}`} cx="50%" cy="0%" r="120%">
            <stop offset="0%" stopColor={pal[1] ?? '#c9a86a'} stopOpacity="0.35" />
            <stop offset="35%" stopColor={pal[2] ?? '#6b7f8c'} stopOpacity="0.22" />
            <stop offset="75%" stopColor="#0f1115" stopOpacity="1" />
          </radialGradient>
          <linearGradient id={`ground-${shotType}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={pal[0] ?? '#2a2a2e'} stopOpacity="1" />
            <stop offset="100%" stopColor="#09090b" stopOpacity="1" />
          </linearGradient>
        </defs>
        <rect width={vbW} height={vbH} fill={`url(#sky-${shotType})`} />
        {/* ground */}
        <rect x="0" y={c.horizon * vbH/100} width={vbW} height={vbH} fill={`url(#ground-${shotType})`} />
        {/* horizon line */}
        <line x1="0" y1={c.horizon * vbH/100} x2={vbW} y2={c.horizon * vbH/100} stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="6 8" />
        {/* sun/moon */}
        <circle cx={vbW*0.82} cy={vbH*0.22} r={vbH*0.08} fill={pal[1]} opacity={0.18} />
        {/* subject silhouette */}
        <g opacity={0.95}>
          {/* body */}
          <ellipse cx={vbW/2} cy={c.y * vbH/100} rx={vbW * c.scale * 0.28} ry={vbH * c.scale * 0.38} fill="#0a0a0c" opacity={0.85} />
          {/* head */}
          <circle cx={vbW/2} cy={ (c.y * vbH/100) - vbH*c.scale*0.32 } r={vbW * c.scale * 0.13} fill="#0a0a0c" />
          {/* shoulders hint */}
          <rect x={vbW/2 - vbW*c.scale*0.22} y={(c.y * vbH/100) - vbH*c.scale*0.12} width={vbW*c.scale*0.44} height={vbH*c.scale*0.08} rx={vbH*c.scale*0.04} fill="#0a0a0c" />
        </g>
        {/* rule of thirds */}
        <g stroke="rgba(255,255,255,0.07)" strokeWidth="0.8" strokeDasharray="4 6">
          <line x1={vbW/3} y1="0" x2={vbW/3} y2={vbH} />
          <line x1={vbW*2/3} y1="0" x2={vbW*2/3} y2={vbH} />
          <line x1="0" y1={vbH/3} x2={vbW} y2={vbH/3} />
          <line x1="0" y1={vbH*2/3} x2={vbW} y2={vbH*2/3} />
        </g>
        {/* OTS foreground shoulder */}
        {shotType==='OTS' && (
          <ellipse cx={vbW*0.22} cy={vbH*0.78} rx={vbW*0.18} ry={vbH*0.32} fill="#0a0a0c" opacity={0.75} />
        )}
        {/* letterbox bars for scope */}
        {letterbox && (aspectRatio==='2.39:1' || aspectRatio==='2:1') && (
          <>
            <rect x="0" y="0" width={vbW} height={vbH*0.08} fill="black" />
            <rect x="0" y={vbH*0.92} width={vbW} height={vbH*0.08} fill="black" />
          </>
        )}
        {/* shot label */}
        <text x={vbW*0.5} y={vbH-10} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="9" fill="rgba(255,255,255,0.42)" letterSpacing="1.5">{shotType}  •  {aspectRatio}</text>
      </svg>
    </div>
  )
}
