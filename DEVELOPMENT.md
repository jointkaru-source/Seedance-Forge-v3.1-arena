# Seedance Forge v3.1 — Guia de Desenvolvimento

## Stack
- React 19 + TypeScript + Vite
- Tailwind CSS v3
- Zustand (single source of truth)
- Tauri v2 + Rust (desktop)
- Node Express (web preview / API proxy)

## Rodando

```bash
pnpm install
pnpm dev        # frontend na porta 5173 (preview e2b compatível)
pnpm server     # API server porta 3001 (proxy Ollama)
pnpm build      # build produção
pnpm preview    # preview build
```

### Tauri (desktop)
Requer Rust + Tauri CLI:
```bash
cargo install tauri-cli
pnpm tauri:dev
pnpm tauri:build
```

### Ollama (opcional, local)
```bash
ollama serve
ollama pull llama3.1
# descobre modelos via TopBar → AI → Discover
```

## Arquitetura
```
Tauri Shell (Rust IPC: save_project_file / load_project_file / get_app_info)
React App
 ├─ TopBar ─ InfiniteCanvas (6000x5000, pan/zoom cursor-centered, boards world coords)
 ├─ Boards (STORY, SCRIPT, CHAR, ENV, TOOLS, DEPTH, PROMPT)
 ├─ Inspector (Frame / Camera / Locks)
 ├─ Timeline (requestAnimationFrame, Σ durations)
 ├─ Zustand Store (project/selection/viewport/playback/history/ui/ai)
 ├─ Domain (Fountain parser, prompt compiler platform-aware, timeline, validation)
 ├─ AI (Mock offline + Ollama local + provider abstraction)
 └─ Export (.seedance / JSON / CSV / PDF print + Bible)
```

## Invariantes
- INV-001 Single Source of Truth
- INV-002 Character Prompt Lock = identidade canônica
- INV-003 Env Lock = ambiente canônico
- INV-004 Shot prompt referencia character+env+camera
- INV-005 Timeline deriva de frame durations
- INV-006 Exports derivam do state canônico
- INV-007 Undo/Redo
- INV-008 Source traceability
- INV-009 Local-first
- INV-010 Visual dark cinematic

## Formatos
- `.seedance` = JSON { schemaVersion, project, boards, exportedAt }
- `CSV` colunas: Shot ID, Scene, Shot Type, Lens, Movement, Duration, Character, Environment, Action, Prompt
- `PDF` via print CSS (window.print)
- `Fountain` parsing suportado (scene_heading, action, character, dialogue, parenthetical, transition)
