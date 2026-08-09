import type { Project } from '../types/project'

export function toCSV(project: Project): string {
  const headers = ['Shot ID','Scene','Shot Type','Lens','Movement','Duration','Character','Environment','Action','Prompt']
  const rows = project.frames.map(f=>{
    const scene = project.scenes.find(s=>s.id===f.sceneId)?.title ?? f.sceneId
    const char = project.characters.find(c=>c.id===f.characterId)?.name ?? ''
    const env = project.environments.find(e=>e.id===f.environmentId)?.name ?? ''
    const action = (f.action || '').replace(/"/g,'""')
    const prompt = (f.prompt || '').replace(/"/g,'""')
    return [
      f.id, `"${scene}"`, f.shotType, f.lens, f.movement, String(f.duration), `"${char}"`, `"${env}"`, `"${action}"`, `"${prompt}"`
    ].join(',')
  })
  return [headers.join(','), ...rows].join('\n')
}

export function toJSON(project: Project): string {
  return JSON.stringify(project, null, 2)
}

export function toSeedance(project: Project, boards?: any): string {
  return JSON.stringify({ schemaVersion: project.schemaVersion, project, boards, exportedAt: new Date().toISOString() }, null, 2)
}

export function downloadFile(content: string, filename: string, mime: string){
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  setTimeout(()=>{ document.body.removeChild(a); URL.revokeObjectURL(url)}, 500)
}
