import type { Project, ValidationIssue } from '../types/project'

export function validateProject(p: Project): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const charIds = new Set(p.characters.map(c=>c.id))
  const envIds = new Set(p.environments.map(e=>e.id))
  const depthIds = new Set(p.depthCells.map(d=>d.id))

  for (const f of p.frames){
    if (f.duration <= 0 || f.duration > 30){
      issues.push({ id: `dur-${f.id}`, level:'warn', message:`Duração inválida (${f.duration}s) — deve ser 0.5–30s`, frameId: f.id })
    }
    if (!f.action?.trim()){
      issues.push({ id:`action-${f.id}`, level:'warn', message:`Shot sem ação descrita`, frameId: f.id })
    }
    if (f.characterId && !charIds.has(f.characterId)){
      issues.push({ id:`char-ref-${f.id}`, level:'error', message:`Referência de personagem quebrada`, frameId:f.id, characterId:f.characterId })
    }
    if (f.environmentId && !envIds.has(f.environmentId)){
      issues.push({ id:`env-ref-${f.id}`, level:'error', message:`Referência de ambiente quebrada`, frameId:f.id, environmentId:f.environmentId })
    }
    if (f.depthCellId && !depthIds.has(f.depthCellId)){
      issues.push({ id:`depth-${f.id}`, level:'warn', message:`Depth cell inválido`, frameId:f.id })
    }
    // continuity warnings
    if (!f.characterId){
      issues.push({ id:`no-char-${f.id}`, level:'info', message:`Sem Character Lock — continuidade pode variar`, frameId:f.id })
    }
    if (!f.environmentId){
      issues.push({ id:`no-env-${f.id}`, level:'info', message:`Sem Env Lock — ambiente não travado`, frameId:f.id })
    }
    if (!f.prompt && !f.action){
      issues.push({ id:`no-prompt-${f.id}`, level:'warn', message:`Sem prompt nem ação — compile no Prompt Studio`, frameId:f.id })
    }
  }

  for (const c of p.characters){
    if (!c.promptLock) issues.push({ id:`c-lock-${c.id}`, level:'info', message:`Personagem "${c.name}" sem Prompt Lock`, characterId:c.id })
  }
  for (const e of p.environments){
    if (!e.promptLock) issues.push({ id:`e-lock-${e.id}`, level:'info', message:`Ambiente "${e.name}" sem Env Lock`, environmentId:e.id })
  }

  if (p.frames.length === 0){
    issues.push({ id:'empty-project', level:'warn', message:'Projeto sem frames — adicione shots no Storyboard' })
  }

  return issues
}
