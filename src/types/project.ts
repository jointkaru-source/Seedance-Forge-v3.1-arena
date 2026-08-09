export const SCHEMA_VERSION = '3.1.0' as const

export type BoardType = 'STORY' | 'SCRIPT' | 'CHAR' | 'ENV' | 'TOOLS' | 'DEPTH' | 'PROMPT'
export type ShotType = 'ELS' | 'LS' | 'MLS' | 'MS' | 'MCU' | 'CU' | 'ECU' | 'OTS' | 'POV'
export type Lens = '16mm' | '24mm' | '35mm' | '50mm' | '85mm' | '135mm'
export type CameraMovement = 'Static' | 'Pan' | 'Tilt' | 'Dolly' | 'Tracking' | 'Orbital' | 'Crane' | 'Handheld'
export type ToolCategory = 'Video' | 'Image' | 'Audio' | 'Script' | 'Upscale' | 'Custom'
export type AspectRatio = '16:9' | '2.39:1' | '2:1' | '4:3' | '9:16' | '1:1'
export type Platform = 'midjourney' | 'flux' | 'seedance' | 'runway' | 'kling' | 'veo' | 'generic'

export type BoardWindowState = {
  id: string
  boardType: BoardType
  x: number
  y: number
  width: number
  height: number
  minimized: boolean
  zIndex: number
}

export type Frame = {
  id: string
  sceneId: string
  index: number
  shotType: ShotType
  lens: Lens
  movement: CameraMovement
  duration: number
  action: string
  dialogue?: string
  prompt?: string
  characterId?: string
  environmentId?: string
  depthCellId?: string
  visualNotes?: string
}

export type Scene = {
  id: string
  title: string
  order: number
  description?: string
  location?: string
  timeOfDay?: string
}

export type Character = {
  id: string
  name: string
  role?: string
  age?: string
  physicalDescription?: string
  personality?: string
  wardrobe?: string
  hair?: string
  eyes?: string
  palette: string[]
  turnaround: {
    front?: string
    profile?: string
    threeQuarter?: string
    back?: string
  }
  references: string[]
  promptLock?: string
  lockStatus: 'missing' | 'draft' | 'locked'
  notes?: string
}

export type Environment = {
  id: string
  name: string
  type?: string
  architecture?: string
  materials?: string
  lighting?: string
  atmosphere?: string
  palette: string[]
  references: string[]
  promptLock?: string
  lockStatus: 'missing' | 'draft' | 'locked'
  notes?: string
}

export type Shot = {
  id: string
  sceneId: string
  frameId?: string
  characterId?: string
  environmentId?: string
  depthCellId?: string
  shotType: ShotType
  lens: Lens
  movement: CameraMovement
  duration: number
  action: string
  dialogue?: string
  notes?: string
  compiledPrompt?: string
}

export type DepthCell = {
  id: string // shotType value
  shotType: ShotType
  foreground: string
  midground: string
  background: string
}

export type AITool = {
  id: string
  name: string
  category: ToolCategory
  url: string
  notes?: string
  enabled: boolean
}

export type SourceDocument = {
  id: string
  name: string
  type: string // TXT MD JSON CSV HTML FOUNTAIN etc
  content: string
  createdAt: string
}

export type Project = {
  id: string
  title: string
  director?: string
  aspectRatio: AspectRatio
  fps: number
  briefing?: string
  sourceDocuments: SourceDocument[]
  characters: Character[]
  environments: Environment[]
  scenes: Scene[]
  frames: Frame[]
  shots: Shot[]
  depthCells: DepthCell[]
  aiTools: AITool[]
  notes?: string
  schemaVersion: string
  createdAt: string
  updatedAt: string
}

export type ViewportState = {
  x: number
  y: number
  zoom: number // 0.3 .. 2.5
}

export type SelectionState = {
  selectedFrameId?: string
  selectedSceneId?: string
  selectedCharacterId?: string
  selectedEnvironmentId?: string
  selectedShotId?: string
  focusedBoardId?: string
}

export type PlaybackState = {
  isPlaying: boolean
  currentTime: number // seconds
  totalDuration: number
}

export type UIState = {
  showAnimatic: boolean
  showBible: boolean
  showShortcuts: boolean
  inspectorTab: 'frame' | 'camera' | 'locks'
  scriptMode: 'edit' | 'preview'
  theme: 'dark'
}

export type AIState = {
  providerId: 'mock' | 'ollama'
  isGenerating: boolean
  lastError?: string
  ollamaModels: string[]
  ollamaUrl: string
}

export type HistoryState = {
  past: Project[]
  future: Project[]
}

export type ValidationIssue = {
  id: string
  level: 'warn' | 'error' | 'info'
  message: string
  frameId?: string
  characterId?: string
  environmentId?: string
}

export const SHOT_TYPES: ShotType[] = ['ELS','LS','MLS','MS','MCU','CU','ECU','OTS','POV']
export const LENSES: Lens[] = ['16mm','24mm','35mm','50mm','85mm','135mm']
export const MOVEMENTS: CameraMovement[] = ['Static','Pan','Tilt','Dolly','Tracking','Orbital','Crane','Handheld']
export const ASPECT_RATIOS: AspectRatio[] = ['16:9','2.39:1','2:1','4:3','9:16','1:1']
export const PLATFORMS: {id: Platform, label: string}[] = [
  {id:'seedance', label:'Seedance'},
  {id:'midjourney', label:'Midjourney'},
  {id:'flux', label:'Flux'},
  {id:'runway', label:'Runway'},
  {id:'kling', label:'Kling'},
  {id:'veo', label:'Veo'},
  {id:'generic', label:'Generic'},
]

export const SHOT_LABELS: Record<ShotType,string> = {
  ELS:'Extreme Long Shot',
  LS:'Long Shot',
  MLS:'Medium Long Shot',
  MS:'Medium Shot',
  MCU:'Medium Close-Up',
  CU:'Close-Up',
  ECU:'Extreme Close-Up',
  OTS:'Over Shoulder',
  POV:'POV'
}
