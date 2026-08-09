import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(cors())
app.use(express.json({limit:'20mb'}))

// in-memory projects
const store = new Map()

// health
app.get('/api/health', (req,res)=> res.json({ ok:true, version:'3.1.0', time: new Date().toISOString()}))

// project CRUD (kept in memory, fallback to file system in Tauri)
app.post('/api/project', (req,res)=>{
  const { id, project } = req.body
  const pid = id || project?.id || `proj_${Date.now()}`
  store.set(pid, project || req.body)
  res.json({ id: pid, saved: true })
})
app.get('/api/project/:id', (req,res)=>{
  const p = store.get(req.params.id)
  if(!p) return res.status(404).json({ error: 'not found'})
  res.json(p)
})
app.get('/api/projects', (req,res)=> res.json(Array.from(store.entries()).map(([id, proj])=>({ id, title: proj.title, updatedAt: proj.updatedAt})) ))

// Ollama proxy (avoid CORS)
app.post('/api/ollama/:path', async (req,res)=>{
  const target = `http://localhost:11434/api/${req.params.path}`
  try{
    const r = await fetch(target, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(req.body)})
    const data = await r.json()
    res.status(r.status).json(data)
  }catch(e){
    res.status(502).json({ error: e.message, hint: 'Ollama not running on host' })
  }
})
app.get('/api/ollama/tags', async (req,res)=>{
  try{
    const r = await fetch('http://localhost:11434/api/tags')
    const data = await r.json()
    res.json(data)
  }catch(e){ res.status(502).json({ error: e.message })}
})

// serve built frontend in production
const dist = path.join(__dirname, '../dist')
app.use(express.static(dist))
app.get('*', (req,res)=>{
  // fallback to index.html for SPA
  res.sendFile(path.join(dist, 'index.html'), err=>{ if(err) res.status(404).send('Not built — run pnpm build') })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, '0.0.0.0', ()=> console.log(`[seedance-server] listening on http://0.0.0.0:${PORT}`))
