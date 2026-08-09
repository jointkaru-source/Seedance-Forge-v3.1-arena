export type AIRequest = {
  prompt: string
  context?: Record<string,any>
  model?: string
}

export type AIResponse = {
  text: string
  model?: string
  usage?: any
}

export interface AIProvider {
  id: string
  name: string
  isAvailable(): Promise<boolean>
  chat(input: AIRequest): Promise<AIResponse>
  generate(input: AIRequest): Promise<AIResponse>
  listModels?(): Promise<string[]>
}

export class MockProvider implements AIProvider {
  id = 'mock'
  name = 'Mock (Offline)'
  async isAvailable(){ return true }
  async chat(req: AIRequest): Promise<AIResponse> {
    await delay(600 + Math.random()*600)
    // deterministicish based on prompt
    const p = req.prompt.toLowerCase()
    if (p.includes('character') || p.includes('prompt lock')){
      return { text: `Cinematic character lock — photorealistic, 35mm, natural skin texture, neutral expression, consistent wardrobe: tailored coat with subtle texture, hair detailed, eye color preserved, palette grounded earth + amber accent, studio turnaround lighting, 8k --ar 16:9` }
    }
    if (p.includes('environment') || p.includes('env lock')){
      return { text: `SOAC environment lock — brutalist concrete with warm timber, volumetric shafts, dusty atmosphere, palette desaturated concrete + amber practical, depth layered foreground/mid/background, anamorphic lens, consistent architectural continuity --ar 16:9` }
    }
    if (p.includes('source') || p.includes('analyze')){
      return { text: JSON.stringify({
        characters:[{name:'ELARA VOSS', role:'Protagonist', age:'32', description:'Intense gaze, weathered coat'}],
        environments:[{name:'OBSERVATORY', type:'Interior', lighting:'Volumetric'}],
        scenes:[{title:'INT. OBSERVATORY - NIGHT', order:1}]
      }, null, 2)}
    }
    if (p.includes('bible')){
      return { text: `VISUAL BIBLE generated from project state — continuity preserved.`}
    }
    return { text: `Mock generated prompt:\n${req.prompt.slice(0,220)}\n\nCinematic, photorealistic, 35mm, shallow depth, dramatic lighting --ar 16:9 --style raw` }
  }
  async generate(req: AIRequest): Promise<AIResponse> { return this.chat(req) }
  async listModels(){ return ['mock-v1','mock-cinematic'] }
}

export class OllamaProvider implements AIProvider {
  id = 'ollama'
  name = 'Ollama (Local)'
  constructor(private baseUrl = 'http://localhost:11434'){}
  async isAvailable(){
    try {
      const r = await fetch(`${this.baseUrl}/api/tags`, { method:'GET' })
      return r.ok
    } catch { return false }
  }
  async listModels(){
    try {
      const r = await fetch(`${this.baseUrl}/api/tags`)
      if(!r.ok) return []
      const j = await r.json()
      return (j.models || []).map((m:any)=>m.name)
    } catch { return [] }
  }
  async chat(req: AIRequest): Promise<AIResponse> {
    const model = req.model || 'llama3.1'
    const r = await fetch(`${this.baseUrl}/api/chat`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        model,
        messages:[{role:'user', content: req.prompt}],
        stream:false
      })
    })
    if(!r.ok) throw new Error(`Ollama error ${r.status}`)
    const j = await r.json()
    const text = j.message?.content || j.response || ''
    return { text, model }
  }
  async generate(req: AIRequest): Promise<AIResponse> {
    const model = req.model || 'llama3.1'
    const r = await fetch(`${this.baseUrl}/api/generate`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ model, prompt: req.prompt, stream:false })
    })
    if(!r.ok) throw new Error(`Ollama error ${r.status}`)
    const j = await r.json()
    return { text: j.response || '', model }
  }
}

function delay(ms:number){ return new Promise(res=>setTimeout(res, ms)) }

export function getProvider(id: 'mock' | 'ollama', ollamaUrl?: string): AIProvider {
  if (id==='ollama') return new OllamaProvider(ollamaUrl)
  return new MockProvider()
}
