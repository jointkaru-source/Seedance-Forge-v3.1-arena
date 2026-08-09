# Seedance Forge v3.1

> **Cinematic pre-production operating environment.**  
> Transforme narrativa e intenção visual num sistema de produção com continuidade — de beats a shots, com identidade travada, câmera explícita e prompts compilados a partir de dados estruturados.

![version](https://img.shields.io/badge/version-3.1.0-amber) ![react](https://img.shields.io/badge/React-19-blue) ![vite](https://img.shields.io/badge/Vite-6-646CFF) ![tauri](https://img.shields.io/badge/Tauri-2-FFC131) ![license](https://img.shields.io/badge/license-MIT-zinc)

**Demo (web):** `pnpm dev` → http://localhost:5173 — canvas 6000×5000 com preview ao vivo  
**Spec técnica completa:** [`docs/SDD_v3.1_SPEC.md`](docs/SDD_v3.1_SPEC.md) (SDD original preservado)  
**Guia de desenvolvimento:** [`DEVELOPMENT.md`](DEVELOPMENT.md)

---

## Visão geral

Seedance Forge **não é** um gerador de imagens. É a camada de orquestração e continuidade que:

- converte **source material** → entidades estruturadas (cenas, personagens, ambientes, shots)
- trava **identidade visual** (Character Prompt Lock) e **arquitetura/atmosfera** (Env Lock SOAC)
- torna **linguagem de câmera** explícita e reutilizável (9 shot types, lentes, movimentos, Depth 3×3)
- compila **prompts platform-aware** a partir de factos de produção, não de texto isolado
- deriva **animatic, Bible e PDFs** do mesmo `Project State` canónico

Princípio: **One Project State → Multiple Production Views** (Storyboard, Script, Character, Environment, Depth, Prompt Studio, Inspector, Timeline, Bible e Export nunca divergem).

---

## Funcionalidades

### Canvas infinito
- Mundo virtual **6000×5000**, zoom **30–250%** **cursor-centered** (`Ctrl/Cmd + Scroll`), pan por arrasto
- **Painel lateral esquerdo (LeftDock)** com navegação de boards (atalhos `1–7`), foco + centralização, indicação de `minimized` e stats do projeto
- Grid sutil, World Map minimap, `RESET VIEW`, `Duplo-clique no header` expande/restaura board, handle `⤡` redimensiona

### TopBar redesenhada
- **Esquerda:** `SF` + pill de projeto (`Título | Director | Aspect | FPS`)
- **Centro:** `Undo/Redo` + `SAVE` primário + `FILE ▾` (Save .seedance, Load, Import Source + hint drag-drop)
- **Direita:** `EXPORT ▾` (JSON/CSV/PDF) + `BIBLE` + `ANIMATIC ▶` + **AI Provider** (`Mock` offline / `Ollama` local com Discover)

### 7 Boards

| Board | Responsabilidade |
|-------|-----------------|
| **STORY-BOARD** | Cenas e frames com thumbnail SVG procedural, `shotType/lens/duration/movement`, select, add/edit/delete, **drag reordenar** e mover entre cenas |
| **SCRIPT-BOARD** | Editor Fountain + Preview, parser (`scene_heading, action, character, dialogue, parenthetical, transition`), **EXTRACT → PROJECT** (cenas/personagens) |
| **CHAR-BOARD** | Ficha de personagem, palette, turnaround, **Prompt Lock** (`missing/draft/locked`) com geração AI, **References grid com drag-drop de imagens** |
| **ENV-BOARD** | SOAC (architecture/materials/lighting/atmosphere), palette, **Env Lock**, **References drag-drop** |
| **TOOLS-BOARD** | Diretório de tools (Video/Image/Audio/Script/Upscale), validação URL, enable/disable, add custom |
| **DEPTH-BOARD** | Grid 3×3 (ELS, LS, MLS, MS, MCU, CU, ECU, OTS, POV) com `foreground/midground/background` por célula + presets de câmera |
| **PROMPT-BOARD** | **Prompt Studio** — compiler determinístico `shot + lens + movement + locks + depth + aspect + platform`, adapters (`seedance/midjourney/flux/runway/kling/veo/generic`), copy/apply/AI generate, batch |

### Inspector + Timeline + Saídas
- **Inspector** (Frame / Camera / Locks) edita o `selectedFrame` canónico
- **Timeline** `Σ frame.duration`, seek, `requestAnimationFrame`, playhead sincronizado
- **Animatic** modal fullscreen com overlays de diálogo e timing derivado do storyboard
- **Visual Production Bible** com cover, personagens/locks, ambientes e shot inventory — `Print/PDF`
- **Validação** não-bloqueante (shot sem lock, duração inválida, refs quebradas)

### Drag & Drop
- **Global (canvas):** solte `.seedance/.json` → Load Project; `.fountain/.txt/.md/.csv/.html` → Source Document; `imagens (PNG/JPG/WEBP)` → anexa ao `character/environment` selecionado
- **Local (Char/Env):** drop zone dedicada com preview e `×` remover

---

## Stack

| Camada | Tech |
|--------|------|
| **Frontend** | React 19, TypeScript, Vite 6, Tailwind CSS v3 |
| **State** | Zustand (single source of truth) + history (undo/redo) + autosave `localStorage` |
| **Desktop** | Tauri v2 + Rust (`save_project_file`, `load_project_file`, `get_app_info`) |
| **Server (web)** | Node + Express (`/api/project`, `/api/ollama` proxy, serve `dist`) |
| **IA** | Mock offline + Ollama local (`/api/tags`, `/api/chat`, `/api/generate`) |
| **Domínio** | Fountain parser, prompt compiler, timeline, validação, VisualFrame SVG |

---

## Começar

### Pré-requisitos
- Node 22+, `pnpm 11` (ou `npm`), Rust (opcional, para Tauri), [Ollama](https://ollama.com) (opcional)

### Instalação

```bash
git clone https://github.com/jointkaru-source/Seedance-Forge-v3.1-arena.git
cd Seedance-Forge-v3.1-arena
pnpm install
```

### Desenvolvimento

```bash
pnpm dev          # frontend  http://localhost:5173  (bind 0.0.0.0, allowedHosts)
pnpm server       # api proxy http://localhost:3001
pnpm build        # tsc + vite build → dist/
pnpm preview      # preview dist em :4173
pnpm typecheck    # tsc --noEmit
```

### Desktop (Tauri)

```bash
cargo install tauri-cli
pnpm tauri:dev    # dev com Rust IPC
pnpm tauri:build  # bundle instalador
```

### Ollama (opcional)

```bash
ollama serve
ollama pull llama3.1
# na TopBar → AI ▾ → OLLAMA → DISCOVER
```

---

## Uso

### Workflow canónico

```
Source (.fountain/.txt/.md)
   → SCRIPT-BOARD Extract → Project.scenes / characters
   → CHAR/ENV Boards → refine + Generate Lock → LOCK ✓
   → STORY-BOARD → shots herdam locks + camera + depth
   → PROMPT-BOARD → compile platform-aware prompt → COPY/APPLY
   → TIMELINE/ANIMATIC verifica timing
   → BIBLE / CSV / PDF / .seedance export
```

### Persistência & Export

- **Autosave** 600ms em `localStorage` (`seedance-forge-v3.1-autosave`)
- **`.seedance`** — `JSON { schemaVersion: "3.1.0", project, boards, exportedAt }` — portátil
- **JSON** — project puro legível
- **CSV** — colunas `Shot ID, Scene, Shot Type, Lens, Movement, Duration, Character, Environment, Action, Prompt`
- **PDF** — `window.print()` com CSS dedicado

### Interações

| Ação | Como |
|------|------|
| Pan canvas | Arraste em vazio |
| Zoom | `Ctrl/Cmd + Scroll` (cursor-centered) ou botões `−/+` |
| Focar board | Clique header (promove `zIndex`) |
| Minimizar | `—`, restaurar `▢` |
| Expandir | **Duplo-clique header** ou botão `⛶` |
| Redimensionar | Handle `⤡` canto inf-dir |
| Navegar boards | LeftDock ou `1–7` |
| Reordenar frames | Drag no Storyboard |
| Mover frame de cena | Inspector → Scene select |
| Undo/Redo | `Ctrl+Z` / `Ctrl+Shift+Z` | 
| Validar | Faixa amarela acima do canvas |
| Arrastar ficheiros | Solte no canvas ou zona Char/Env |

---

## Estrutura

```
.
├── src/
│   ├── components/
│   │   ├── TopBar.tsx          # SAVE/FILE/EXPORT/BIBLE/ANIMATIC/AI
│   │   ├── LeftDock.tsx        # navegação boards 1–7
│   │   ├── InfiniteCanvas.tsx  # 6000×5000, pan/ctrl-zoom
│   │   ├── BoardWindow.tsx     # drag/focus/minimize/expand/resize
│   │   ├── InspectorPanel.tsx  # Frame/Camera/Locks
│   │   ├── TimelineBar.tsx     # Σ durations + raf
│   │   ├── VisualFrame.tsx     # SVG procedural por shotType/aspect
│   │   ├── boards/             # STORY, SCRIPT, CHAR, ENV, TOOLS, DEPTH, PROMPT
│   │   └── modals/             # Animatic, Bible
│   ├── store/useStore.ts       # Zustand + history + autosave
│   ├── domain/                 # fountain, prompt, timeline, validation
│   ├── services/               # ai (Mock/Ollama), export
│   ├── types/project.ts        # SCHEMA_VERSION 3.1.0
│   └── App.tsx + main.tsx + index.css
├── server/                     # Express /api + static dist
├── src-tauri/                  # Rust IPC (Tauri v2)
├── docs/SDD_v3.1_SPEC.md       # spec original
├── DEVELOPMENT.md              # guia dev detalhado
└── dist/                       # build (ignorado)
```

---

## Arquitetura

```
                Tauri Shell (Rust IPC)
                      │
              React App (Vite)
 TopBar ─ LeftDock ─ Canvas ─ Boards ─ Inspector ─ Timeline
                        │                │
                   Zustand Store (SSOT)
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   Project Model   AI Services    Export Services
        │               │               │
   JSON/.seedance  Ollama/Mock      PDF/CSV/Bible
```

Invariantes: `SSOT`, `Prompt Lock canónico`, `Env Lock canónico`, `shot context`, `timeline consistency`, `export consistency`, `reversibility`, `source traceability`, `local-first`, `visual continuity` — ver `DEVELOPMENT.md`.

---

## AI

- **Mock** determinístico, offline, para UI/testes/demos
- **Ollama** local — `http://localhost:11434`, `listModels`, `chat`, `generate`; resultados exigem `LOCK` / `APPLY` antes de canónico
- Prioridade de contexto: `Project State > Approved Lock > Notas > Parsed Source > Inferência AI` — sem invenção silenciosa

---

## Roadmap

- [x] Canvas + BoardWindow + Zustand + persistência
- [x] 7 boards + Inspector + Timeline + Animatic + Bible
- [x] Fountain + prompt compiler + validação
- [x] Mock + Ollama + drag-drop + LeftDock + TopBar nova
- [ ] Testes (Fountain, prompt, timeline, mutações, export)
- [ ] Auto-save policy + recovery
- [ ] Storage de assets dentro de `.seedance` (zip)
- [ ] Virtualização para 100+ frames

---

## Contribuir

```bash
pnpm typecheck && pnpm build   # antes de PR
```

Branch deste ciclo: `arena/019fe6d4-seedance-forge-v3-1-arena`.  
Commits seguem `feat:`, `fix:`, `docs:`.

## Licença

MIT — ver `LICENSE` (se aplicável). SDD original © Seedance Forge.

---

> **Nota sobre o README anterior:** o ficheiro anterior era a spec técnica completa; foi movido para [`docs/SDD_v3.1_SPEC.md`](docs/SDD_v3.1_SPEC.md) e este README reescrito como documentação correta do produto.
