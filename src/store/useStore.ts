import { create } from 'zustand'
import type { Project, BoardWindowState, ViewportState, SelectionState, PlaybackState, UIState, AIState, Character, Environment, Frame, Scene, DepthCell, AITool, SourceDocument } from '../types/project'
import { SCHEMA_VERSION, SHOT_TYPES } from '../types/project'
import { uid, nowIso } from '../utils/id'

type History = { past: Project[], future: Project[] }

type StoreState = {
  project: Project
  viewport: ViewportState
  boards: BoardWindowState[]
  selection: SelectionState
  playback: PlaybackState
  ui: UIState
  ai: AIState
  history: History
  toasts: {id:string, msg:string, type:'success'|'error'|'info'}[]

  // actions
  setProjectMeta: (p: Partial<Pick<Project,'title'|'director'|'aspectRatio'|'fps'|'briefing'>>) => void
  updateProject: (fn: (draft: Project)=>void) => void

  // viewport
  setViewport: (v: Partial<ViewportState>) => void
  // boards
  moveBoard: (id:string, x:number, y:number) => void
  resizeBoard: (id:string, w:number, h:number) => void
  focusBoard: (id:string) => void
  toggleMinimize: (id:string) => void

  // selection
  selectFrame: (id?: string) => void
  selectCharacter: (id?: string) => void
  selectEnvironment: (id?: string) => void

  // scenes/frames
  addScene: () => void
  updateScene: (id:string, patch: Partial<Scene>) => void
  deleteScene: (id:string) => void
  addFrame: (sceneId:string) => void
  updateFrame: (id:string, patch: Partial<Frame>) => void
  deleteFrame: (id:string) => void
  reorderFrames: (orderedIds: string[]) => void
  moveFrameToScene: (frameId:string, targetSceneId:string) => void

  // characters
  addCharacter: () => void
  updateCharacter: (id:string, patch: Partial<Character>) => void
  deleteCharacter: (id:string) => void

  // envs
  addEnvironment: () => void
  updateEnvironment: (id:string, patch: Partial<Environment>) => void
  deleteEnvironment: (id:string) => void

  // tools
  addTool: (tool: Omit<AITool,'id'>) => void
  updateTool: (id:string, patch: Partial<AITool>) => void
  deleteTool: (id:string) => void

  // depth
  updateDepthCell: (id:string, patch: Partial<DepthCell>) => void

  // playback
  setPlayback: (p: Partial<PlaybackState>) => void
  // ui
  setUI: (u: Partial<UIState>) => void
  // ai
  setAI: (a: Partial<AIState>) => void

  // source docs
  addSourceDoc: (doc: Omit<SourceDocument,'id'|'createdAt'>) => void

  // history
  undo: () => void
  redo: () => void
  pushHistory: () => void

  // persistence
  loadProject: (proj: Project, boards?: BoardWindowState[]) => void
  toast: (msg:string, type?: 'success'|'error'|'info') => void
  dismissToast: (id:string)=>void
}

function defaultDepthCells(): DepthCell[] {
  return SHOT_TYPES.map(st=>({ id: st, shotType: st, foreground:'', midground:'', background:'' }))
}

function defaultTools(): AITool[] {
  return [
    { id: uid('tool'), name:'Seedance AI', category:'Video', url:'https://seedance.example.com', enabled:true },
    { id: uid('tool'), name:'Runway', category:'Video', url:'https://runwayml.com', enabled:true },
    { id: uid('tool'), name:'Kling', category:'Video', url:'https://kling.kuaishou.com', enabled:true },
    { id: uid('tool'), name:'Midjourney', category:'Image', url:'https://midjourney.com', enabled:true },
    { id: uid('tool'), name:'Flux', category:'Image', url:'https://flux.example.com', enabled:true },
    { id: uid('tool'), name:'ElevenLabs', category:'Audio', url:'https://elevenlabs.io', enabled:true },
    { id: uid('tool'), name:'Topaz', category:'Upscale', url:'https://topazlabs.com', enabled:true },
  ]
}

function createInitialProject(): Project {
  const scene1: Scene = { id: uid('scene'), title:'INT. OBSERVATORY - NIGHT', order:0, description:'A derelict mountain observatory during a storm.', location:'Observatory', timeOfDay:'Night' }
  const scene2: Scene = { id: uid('scene'), title:'EXT. RIDGE - DAWN', order:1, description:'Exterior ridge overlooking valley, first light.', location:'Ridge', timeOfDay:'Dawn' }
  const char1: Character = {
    id: uid('char'), name:'ELARA VOSS', role:'Lead', age:'32',
    physicalDescription:'Sharp features, intense hazel eyes, weathered field coat',
    personality:'Obsessive, precise, haunted',
    wardrobe:'Waxed canvas coat, charcoal turtleneck, brass compass',
    hair:'Dark brown, pulled back', eyes:'Hazel', palette:['#2a2a2e','#c9a86a','#6b7f8c','#e8ddd0'],
    turnaround:{}, references:[], promptLock:'Photorealistic woman 32, hazel eyes, dark brown hair tied back, sharp cheekbones, waxed canvas field coat over charcoal knit, brass compass pendant, natural skin texture, neutral expression, studio turnaround lighting, 35mm -- consistent identity', lockStatus:'locked', notes:'Keep coat texture & compass'
  }
  const char2: Character = {
    id: uid('char'), name:'MARCUS REIN', role:'Support', age:'45',
    physicalDescription:'Broad, beard, kind eyes',
    personality:'Steady, skeptical',
    wardrobe:'Olive field jacket',
    hair:'Salt & pepper short', eyes:'Blue', palette:['#3d4a3a','#b8a27a','#2f2f30'],
    turnaround:{}, references:[], promptLock:'', lockStatus:'missing'
  }
  const env1: Environment = {
    id: uid('env'), name:'OBSERVATORY DOME', type:'Interior', architecture:'Brutalist concrete dome with steel ribbing, circular aperture',
    materials:'Raw concrete, oxidized steel, warm timber catwalk',
    lighting:'Volumetric shafts through aperture, amber practicals',
    atmosphere:'Dusty, cold, cinematic haze', palette:['#9a9a9a','#f59e0b','#1a1a1e','#d8c9b8'],
    references:[], promptLock:'Brutalist observatory dome interior, raw concrete + steel ribs, circular open aperture, volumetric light shafts, dusty atmosphere, warm amber practicals, anamorphic, cinematic -- consistent architecture', lockStatus:'locked'
  }
  const env2: Environment = {
    id: uid('env'), name:'RIDGE EXTERIOR', type:'Exterior', architecture:'Mountain ridge, sparse pines',
    materials:'Rock, pine, snow dust', lighting:'Cold dawn, soft diffusion', atmosphere:'Vast, quiet, wind', palette:['#6b8291','#e6ddd2','#2f3a42'],
    references:[], promptLock:'', lockStatus:'missing'
  }

  const frames: Frame[] = [
    { id: uid('frame'), sceneId: scene1.id, index:0, shotType:'ELS', lens:'24mm', movement:'Static', duration:3, action:'Observatory dome under storm, aperture open to swirling clouds.', characterId: char1.id, environmentId: env1.id, depthCellId:'ELS', visualNotes:'Horizon low, silhouette scale' },
    { id: uid('frame'), sceneId: scene1.id, index:1, shotType:'MS', lens:'50mm', movement:'Dolly', duration:2.5, action:'Elara adjusts brass telescope, breath visible.', dialogue:'We shouldn’t be here after dark.', characterId: char1.id, environmentId: env1.id, depthCellId:'MS' },
    { id: uid('frame'), sceneId: scene1.id, index:2, shotType:'CU', lens:'85mm', movement:'Handheld', duration:2, action:'Close on compass spinning unsettled.', characterId: char1.id, environmentId: env1.id, depthCellId:'CU' },
    { id: uid('frame'), sceneId: scene2.id, index:0, shotType:'LS', lens:'35mm', movement:'Crane', duration:4, action:'Dawn breaks over ridge, observatory silhouette distant.', environmentId: env2.id, depthCellId:'LS', visualNotes:'Anamorphic flare' },
    { id: uid('frame'), sceneId: scene2.id, index:1, shotType:'OTS', lens:'50mm', movement:'Tracking', duration:3, action:'Over Marcus shoulder — Elara walks toward light.', characterId: char1.id, environmentId: env2.id, depthCellId:'OTS', dialogue:'It’s already awake.' },
  ]

  return {
    id: uid('proj'), title:'SEEDANCE — ECLIPSE', director:'A. Karu', aspectRatio:'2.39:1', fps:24,
    briefing:'Atmospheric sci-fi about an eclipse that awakens the observatory.',
    sourceDocuments: [],
    characters:[char1,char2],
    environments:[env1,env2],
    scenes:[scene1,scene2],
    frames,
    shots: [],
    depthCells: defaultDepthCells(),
    aiTools: defaultTools(),
    notes:'',
    schemaVersion: SCHEMA_VERSION,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

function defaultBoards(): BoardWindowState[] {
  // world coordinates
  return [
    { id:'board-story', boardType:'STORY', x: 80, y: 80, width: 720, height: 520, minimized:false, zIndex:1 },
    { id:'board-script', boardType:'SCRIPT', x: 840, y: 80, width: 560, height: 520, minimized:false, zIndex:2 },
    { id:'board-char', boardType:'CHAR', x: 80, y: 680, width: 520, height: 460, minimized:false, zIndex:3 },
    { id:'board-env', boardType:'ENV', x: 640, y: 680, width: 520, height: 460, minimized:false, zIndex:4 },
    { id:'board-tools', boardType:'TOOLS', x: 1440, y: 80, width: 380, height: 420, minimized:false, zIndex:5 },
    { id:'board-depth', boardType:'DEPTH', x: 1440, y: 540, width: 380, height: 520, minimized:false, zIndex:6 },
    { id:'board-prompt', boardType:'PROMPT', x: 80, y: 1180, width: 1080, height: 480, minimized:false, zIndex:7 },
  ]
}

const initialProject = createInitialProject()

let historyDebounce: number | null = null
const LS_KEY = 'seedance-forge-v3.1-autosave'

function loadAutosave(): {project: Project, boards: BoardWindowState[], viewport: ViewportState} | null {
  try{
    const raw = localStorage.getItem(LS_KEY)
    if(!raw) return null
    const data = JSON.parse(raw)
    if(data?.project?.schemaVersion) return data
  }catch{}
  return null
}
const autosaved = typeof window !== 'undefined' ? loadAutosave() : null

export const useStore = create<StoreState>((set, get)=>({
  project: autosaved?.project ?? initialProject,
  viewport: autosaved?.viewport ?? { x: -80, y: -60, zoom: 0.92 },
  boards: autosaved?.boards ?? defaultBoards(),
  selection: { selectedFrameId: (autosaved?.project ?? initialProject).frames[0]?.id, selectedCharacterId: (autosaved?.project ?? initialProject).characters[0]?.id, selectedEnvironmentId: (autosaved?.project ?? initialProject).environments[0]?.id, focusedBoardId:'board-story' },
  playback: { isPlaying: false, currentTime: 0, totalDuration: (autosaved?.project ?? initialProject).frames.reduce((a,f)=>a+f.duration,0) },
  ui: { showAnimatic:false, showBible:false, showShortcuts:false, inspectorTab:'frame', scriptMode:'edit', theme:'dark' },
  ai: { providerId:'mock', isGenerating:false, ollamaModels:[], ollamaUrl:'http://localhost:11434' },
  history: { past:[], future:[] },
  toasts: [],

  setProjectMeta: (patch) => {
    get().pushHistory()
    set(s=>({ project:{...s.project, ...patch, updatedAt: nowIso() }}))
  },
  updateProject: (fn) => {
    get().pushHistory()
    const p = structuredClone(get().project) as Project
    fn(p)
    p.updatedAt = nowIso()
    const total = p.frames.reduce((a,f)=>a+f.duration,0)
    set({ project: p, playback:{...get().playback, totalDuration: total }})
  },

  setViewport: (v) => set(s=>({ viewport:{...s.viewport, ...v}})),
  moveBoard: (id,x,y)=> set(s=>({ boards: s.boards.map(b=> b.id===id? {...b,x,y}:b)})),
  resizeBoard: (id,w,h)=> set(s=>({ boards: s.boards.map(b=> b.id===id? {...b,width:w,height:h}:b)})),
  focusBoard: (id)=> set(s=>{
    const maxZ = Math.max(...s.boards.map(b=>b.zIndex), 0)
    return { boards: s.boards.map(b=> b.id===id? {...b, zIndex:maxZ+1}:b), selection:{...s.selection, focusedBoardId:id}}
  }),
  toggleMinimize: (id)=> set(s=>({ boards: s.boards.map(b=> b.id===id? {...b, minimized:!b.minimized}:b)})),

  selectFrame: (id)=> set(s=>({ selection:{...s.selection, selectedFrameId:id}})),
  selectCharacter: (id)=> set(s=>({ selection:{...s.selection, selectedCharacterId:id}})),
  selectEnvironment: (id)=> set(s=>({ selection:{...s.selection, selectedEnvironmentId:id}})),

  addScene: ()=>{
    get().pushHistory()
    const scene: Scene = { id: uid('scene'), title:`INT. NEW LOCATION - DAY`, order: get().project.scenes.length, description:'' }
    set(s=>({ project:{...s.project, scenes:[...s.project.scenes, scene], updatedAt: nowIso()}}))
  },
  updateScene: (id, patch)=>{
    get().pushHistory()
    set(s=>({ project:{...s.project, scenes: s.project.scenes.map(sc=> sc.id===id? {...sc,...patch}:sc), updatedAt: nowIso()}}))
  },
  deleteScene: (id)=>{
    get().pushHistory()
    set(s=>{
      const scenes = s.project.scenes.filter(sc=>sc.id!==id)
      const frames = s.project.frames.filter(f=>f.sceneId!==id)
      return { project:{...s.project, scenes, frames, updatedAt: nowIso()}, playback:{...s.playback, totalDuration: frames.reduce((a,f)=>a+f.duration,0)}}
    })
  },
  addFrame: (sceneId)=>{
    get().pushHistory()
    const sceneFrames = get().project.frames.filter(f=>f.sceneId===sceneId)
    const f: Frame = { id: uid('frame'), sceneId, index: sceneFrames.length, shotType:'MS', lens:'35mm', movement:'Static', duration:2.5, action:'New shot — describe action.' }
    set(s=>{
      const frames = [...s.project.frames, f]
      return { project:{...s.project, frames, updatedAt: nowIso()}, selection:{...s.selection, selectedFrameId:f.id}, playback:{...s.playback, totalDuration: frames.reduce((a,fr)=>a+fr.duration,0)}}
    })
  },
  updateFrame: (id,patch)=>{
    // debounced history push for typing
    if (historyDebounce) window.clearTimeout(historyDebounce)
    // push history on first edit in burst if not already scheduled
    const shouldPushNow = !get().history.past.length || get().history.past[get().history.past.length-1]?.frames.find(f=>f.id===id)?.action !== get().project.frames.find(f=>f.id===id)?.action
    if (shouldPushNow && !historyDebounce) {
      // small immediate push for first keystroke is too noisy, so we delay push 700ms then push before mutation
      historyDebounce = window.setTimeout(()=>{
        get().pushHistory()
        historyDebounce = null
      }, 700) as unknown as number
    } else if (!historyDebounce){
      historyDebounce = window.setTimeout(()=>{ get().pushHistory(); historyDebounce=null }, 700) as unknown as number
    }
    set(s=>{
      const frames = s.project.frames.map(f=> f.id===id? {...f,...patch}:f)
      return { project:{...s.project, frames, updatedAt: nowIso()}, playback:{...s.playback, totalDuration: frames.reduce((a,f)=>a+f.duration,0)}}
    })
  },
  deleteFrame: (id)=>{
    get().pushHistory()
    set(s=>{
      const frames = s.project.frames.filter(f=>f.id!==id)
      // reindex per scene
      const byScene = new Map<string, Frame[]>()
      frames.forEach(f=>{ const arr=byScene.get(f.sceneId)??[]; arr.push(f); byScene.set(f.sceneId,arr)})
      byScene.forEach(arr=> arr.sort((a,b)=>a.index-b.index).forEach((f,i)=>f.index=i))
      const flat = Array.from(byScene.values()).flat()
      // keep remaining frames order by flat but also include any not grouped correctly
      const remaining = s.project.frames.filter(f=>f.id!==id)
      // rebuild with correct indexes
      const grouped = new Map<string, Frame[]>()
      remaining.forEach(f=>{ const a=grouped.get(f.sceneId)??[]; a.push(f as Frame); grouped.set(f.sceneId,a)})
      grouped.forEach(list=>{
        list.sort((a,b)=>a.index-b.index)
        list.forEach((f,i)=>f.index=i)
      })
      const newFrames = Array.from(grouped.values()).flat()
      return { project:{...s.project, frames: newFrames, updatedAt: nowIso()}, playback:{...s.playback, totalDuration: newFrames.reduce((a,f)=>a+f.duration,0)}}
    })
  },
  reorderFrames: (orderedIds)=>{
    get().pushHistory()
    set(s=>{
      const map = new Map(s.project.frames.map(f=>[f.id,f] as const))
      // We need to infer scene grouping: orderedIds is global order within a scene? We assume caller passes ids in desired order for a single scene OR global.
      // Determine if all belong to same scene
      const framesInOrder = orderedIds.map(id=> map.get(id)!).filter(Boolean)
      if (framesInOrder.length===0) return s
      // if same scene, update indexes within that scene only
      const sceneId = framesInOrder[0].sceneId
      const sameScene = framesInOrder.every(f=>f.sceneId===sceneId)
      if (sameScene){
        const updated = s.project.frames.map(f=>{
          const idx = orderedIds.indexOf(f.id)
          if (idx!==-1) return {...f, index: idx}
          return f
        })
        return { project:{...s.project, frames: updated, updatedAt: nowIso()}}
      } else {
        // global reorder: assign index sequentially but preserve scene grouping? For cross-scene reorder we keep sceneId as originally but reorder index globally? Simpler: update index based on position in orderedIds
        const updated = orderedIds.map((id,i)=> ({...map.get(id)!, index:i}))
        // include frames not in orderedIds
        const remaining = s.project.frames.filter(f=> !orderedIds.includes(f.id))
        return { project:{...s.project, frames:[...updated, ...remaining], updatedAt: nowIso()}}
      }
    })
  },
  moveFrameToScene: (frameId, targetSceneId)=>{
    get().pushHistory()
    set(s=>{
      const frames = s.project.frames.map(f=> f.id===frameId? {...f, sceneId: targetSceneId, index: s.project.frames.filter(x=>x.sceneId===targetSceneId).length }: f)
      // reindex old and new scenes
      const grouped = new Map<string, Frame[]>()
      frames.forEach(f=>{ const a= grouped.get(f.sceneId)??[]; a.push(f); grouped.set(f.sceneId,a)})
      grouped.forEach(list=>{ list.sort((a,b)=>a.index-b.index).forEach((f,i)=>f.index=i)})
      return { project:{...s.project, frames: Array.from(grouped.values()).flat(), updatedAt: nowIso()}}
    })
  },

  addCharacter: ()=>{
    get().pushHistory()
    const c: Character = { id: uid('char'), name:'NEW CHARACTER', palette:['#3a3a3a','#d4a574','#7a8a99'], turnaround:{}, references:[], promptLock:'', lockStatus:'missing' }
    set(s=>({ project:{...s.project, characters:[...s.project.characters,c], updatedAt: nowIso()}, selection:{...s.selection, selectedCharacterId:c.id}}))
  },
  updateCharacter: (id,patch)=> {
    // debounced history
    if (historyDebounce) window.clearTimeout(historyDebounce)
    historyDebounce = window.setTimeout(()=>{ get().pushHistory(); historyDebounce=null }, 700) as unknown as number
    set(s=>({ project:{...s.project, characters: s.project.characters.map(c=>c.id===id? {...c,...patch}:c), updatedAt: nowIso()}}))
  },
  deleteCharacter: (id)=>{
    get().pushHistory()
    set(s=>({ project:{...s.project, characters: s.project.characters.filter(c=>c.id!==id), updatedAt: nowIso()}}))
  },

  addEnvironment: ()=>{
    get().pushHistory()
    const e: Environment = { id: uid('env'), name:'NEW ENVIRONMENT', palette:['#8a8a8a','#2a2a2e'], references:[], promptLock:'', lockStatus:'missing' }
    set(s=>({ project:{...s.project, environments:[...s.project.environments,e], updatedAt: nowIso()}, selection:{...s.selection, selectedEnvironmentId:e.id}}))
  },
  updateEnvironment: (id,patch)=> {
    if (historyDebounce) window.clearTimeout(historyDebounce)
    historyDebounce = window.setTimeout(()=>{ get().pushHistory(); historyDebounce=null }, 700) as unknown as number
    set(s=>({ project:{...s.project, environments: s.project.environments.map(e=>e.id===id? {...e,...patch}:e), updatedAt: nowIso()}}))
  },
  deleteEnvironment: (id)=>{
    get().pushHistory()
    set(s=>({ project:{...s.project, environments: s.project.environments.filter(e=>e.id!==id), updatedAt: nowIso()}}))
  },

  addTool: (tool)=>{
    get().pushHistory()
    const t: AITool = { ...tool, id: uid('tool')}
    set(s=>({ project:{...s.project, aiTools:[...s.project.aiTools, t], updatedAt: nowIso()}}))
  },
  updateTool: (id,patch)=> set(s=>({ project:{...s.project, aiTools: s.project.aiTools.map(t=>t.id===id? {...t,...patch}:t), updatedAt: nowIso()}})),
  deleteTool: (id)=>{
    get().pushHistory()
    set(s=>({ project:{...s.project, aiTools: s.project.aiTools.filter(t=>t.id!==id), updatedAt: nowIso()}}))
  },

  updateDepthCell: (id,patch)=> set(s=>({ project:{...s.project, depthCells: s.project.depthCells.map(d=>d.id===id? {...d,...patch}:d), updatedAt: nowIso()}})),

  setPlayback: (p)=> set(s=>({ playback:{...s.playback, ...p}})),
  setUI: (u)=> set(s=>({ ui:{...s.ui, ...u}})),
  setAI: (a)=> set(s=>({ ai:{...s.ai, ...a}})),

  addSourceDoc: (doc)=>{
    get().pushHistory()
    const sd: SourceDocument = { ...doc, id: uid('src'), createdAt: nowIso()}
    set(s=>({ project:{...s.project, sourceDocuments:[...s.project.sourceDocuments, sd], updatedAt: nowIso()}}))
  },

  pushHistory: ()=>{
    const p = structuredClone(get().project) as Project
    set(s=>{
      const past = [...s.history.past, p]
      if (past.length>120) past.shift()
      return { history:{ past, future:[] }}
    })
  },
  undo: ()=>{
    const { past, future } = get().history
    if (!past.length) return
    const prev = past[past.length-1]
    const curr = structuredClone(get().project) as Project
    set({ project: prev, history:{ past: past.slice(0,-1), future:[curr, ...future] }})
  },
  redo: ()=>{
    const { past, future } = get().history
    if (!future.length) return
    const next = future[0]
    const curr = structuredClone(get().project) as Project
    set({ project: next, history:{ past:[...past, curr], future: future.slice(1)}})
  },

  loadProject: (proj, boards)=>{
    set(s=>({
      project: {...proj, updatedAt: nowIso()},
      boards: boards ?? s.boards,
      playback:{...s.playback, totalDuration: proj.frames.reduce((a,f)=>a+f.duration,0), currentTime:0, isPlaying:false},
      history:{past:[], future:[]}
    }))
  },

  toast: (msg,type='info')=>{
    const id = uid('toast')
    set(s=>({ toasts:[...s.toasts, {id, msg, type}]}))
    setTimeout(()=> get().dismissToast(id), 3000)
  },
  dismissToast:(id)=> set(s=>({ toasts: s.toasts.filter(t=>t.id!==id)}))
}))

// autosave subscription (persist project/boards/viewport)
if (typeof window !== 'undefined'){
  let saveTimeout: number | null = null
  useStore.subscribe((state)=>{
    if (saveTimeout) window.clearTimeout(saveTimeout)
    saveTimeout = window.setTimeout(()=>{
      try{
        localStorage.setItem(LS_KEY, JSON.stringify({ project: state.project, boards: state.boards, viewport: state.viewport }))
      }catch{}
    }, 600) as unknown as number
  })
}
