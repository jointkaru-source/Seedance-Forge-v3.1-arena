# Classificação: [HÍBRIDO] — Predominantemente TÉCNICO com componente CRIATIVO forte (cinema/pre-production, direção de arte, linguagem de câmera e sistema visual)

> Híbrido porque une implementação full-stack (React/Tauri/Zustand/Node) com direção criativa (continuidade cinematográfica, art-direction, câmera, luz, estética dark cinematic). Documento gerado em 2026-08-16 a partir da conversa completa.

---

# 📋 Contexto do Projeto: Seedance Forge v3.1

## Objetivo

> Construir Seedance Forge v3.1 como **cinematic pre-production operating environment** real e stateful — não protótipo visual. Transformar material narrativo em sistema de produção onde beats → cenas → shots herdam continuidade (Character Prompt Lock, Env Lock SOAC, câmera explícita, prompts compilados de dados estruturados). Saídas derivam do mesmo Project State: animatic, Visual Production Bible, CSV e PDF set-ready. Substituir visualmente o projeto inicial e evoluir UI sob demanda, com reescrita do README (SDD original era engano).

## Stack & Ferramentas

- **Frontend:** React 19.0.0 / 19.2.8, TypeScript 5.7.3 / 5.9.3, Vite 6.2.5 / 6.4.3, Tailwind CSS v3.4.17/19, @vitejs/plugin-react 4.7.0, autoprefixer 10.5.4, postcss 8.5.26
- **State:** Zustand 5.0.14 (single source of truth)
- **Desktop:** Tauri v2 + Rust (IPC: `save_project_file`, `load_project_file`, `get_app_info`), `tauri.conf.json` (productName `Seedance Forge v3.1`, identifier `com.seedance.forge`)
- **Server (web preview / proxy):** Node 22.22.3, Express 4.18.2, CORS 2.8.5, porta 3001 (`/api/health`, `/api/project`, `/api/ollama/tags` e proxy), serve `dist/`
- **IA:** Mock Provider (offline determinístico) + OllamaProvider (`http://localhost:11434`, `/api/tags`, `/api/chat`, `/api/generate`, model discovery)
- **Package manager:** pnpm 11.20.0 (npm 10.9.8 disponível), lockfile `pnpm-lock.yaml`
- **Infra/Preview:** Bind `0.0.0.0:5173` (vite) / `0.0.0.0:4173` (preview), `allowedHosts: true`, `X-Frame-Options: ALLOWALL`, host preview `https://5173-{sandboxId}.e2b.app`
- **Repo:** `jointkaru-source/Seedance-Forge-v3.1-arena`, branch fixo `arena/019fe6d4-seedance-forge-v3-1-arena` (base `17ded2a`), remote `origin` autenticado via `gh`/`git`
- **Outros:** `zustand`, `tailwindcss`, `vite`, `tauri-build 2.0`, `serde`, `tokio`, `dirs 5.0`

## Decisões Tomadas

- **Arquitetura SSOT:** Zustand com `project/selection/viewport/boards/playback/history/ui/ai/toasts`; canonical state → todas views (INV-001)
- **Canvas virtual 6000×5000**, zoom 30–250% **cursor-centered**; `pan` por arraste com `setPointerCapture`; board coords em **world coordinates** não screen
- **Zoom alterado para `Ctrl/Cmd + Scroll`** (antes scroll direto); wheel sem Ctrl faz pan; scroll dentro de board preserva scroll nativo; botões `−/+` e `RESET VIEW` mantidos
- **BoardWindow:** drag por header, focus promove `zIndex`, `minimize` só altera apresentação, **duplo-clique header expande/restaura** (85% viewport, salva `prevSize`), botão `⛶/▣` e handle `⤡` redimensionável (clamp 320–1400 x 240–900)
- **LeftDock novo (64px, `hidden md:flex`):** navegação 1–7 com cor/ícone/kbd, foco + centralização viewport (`vw/2 - cx*zoom`), indicador `minimized`, stats `SHOTS/SCENES`, `RESET`
- **TopBar redesenhada:** esquerda pill projeto (`title | director | aspect | FPS`), centro `Undo/Redo` + `SAVE` primário + `FILE ▾` (Save .seedance, Load, Import Source + hint drag), direita `EXPORT ▾` (JSON/CSV/PDF) + `BIBLE` + `ANIMATIC ▶` + AI selector `Mock/Ollama` com `Discover`
- **Drag & Drop global:** overlay `SOLTE PARA IMPORTAR`; `.seedance/.json` → `loadProject`; `.fountain/.txt/.md/.csv/.html` → `addSourceDoc`; `image/*` (dataURL) → anexa a `character.references` ou `environment.references` do selecionado
- **Char/Env Boards:** drop zone dedicada com grid 3 col, preview, `×` remover, file picker `+ADD` (Promise.all dataURL), turnaround ainda por inputs
- **Prompt compiler platform-aware:** `seedance/midjourney/flux/runway/kling/veo/generic` com syntax específica (`--ar`, `--style raw` etc) compilando `shotType+lance+movement+PromptLock+EnvLock+depth+aspect`
- **Fountain parser:** `scene_heading/action/character/dialogue/parenthetical/transition/blank/lyric`, preview HTML e `EXTRACT → PROJECT` (cenas/personagens)
- **Timeline:** `totalDuration = Σ frame.duration`, progress `currentTime/totalDuration`, `requestAnimationFrame`, seek por clique
- **Persistência:** `.seedance` = `JSON {schemaVersion, project, boards, exportedAt}`, versão `3.1.0`, `localStorage` autosave 600ms (`seedance-forge-v3.1-autosave`), history debounced 700ms, undo/redo até 120 snapshots
- **Tauri stub + Express server** para operação local/offline + proxy Ollama (evita CORS)
- **Vite config:** `host 0.0.0.0`, `cors:true`, `allowedHosts:true` para preview e2b
- **README reescrito:** SDD original (1702 linhas) movido para `docs/SDD_v3.1_SPEC.md`, novo README 246 linhas criado; `DEVELOPMENT.md` mantido; `.gitignore` (node_modules/dist/target etc)

## Restrições & Requisitos

- **Branch fixo:** todo trabalho em `arena/019fe6d4-seedance-forge-v3-1-arena`; nunca trocar/criar/push em outro branch; `git push origin arena/...` apenas
- **Não apagar/renomear** `/home/user/Seedance-Forge-v3.1-arena` nem `.git`
- **Local-first obrigatório (INV-009):** authoring, navegação, edição, save/load, prompt compile, timeline e Mock devem funcionar offline
- **Invariantes arquiteturais (INV-001 a 010):** SSOT, Prompt Lock/Env Lock canónicos, shot context, timeline consistency, export consistency, reversibilidade, traceabilidade, operação local, continuidade visual
- **Performance:** evitar rerenders em pointer move, usar memo/selectors, `requestAnimationFrame`, debounce parsing, não persistir em cada pointer move, virtualizar listas grandes
- **Design:** preservar linguagem dark cinematic (glass, glow sutil, metadata técnica), evitar SaaS genérico, gradients decorativos, layouts centralizados excessivos
- **Segurança:** nunca pedir passwords/PAT/OAuth/2FA; usar `git`/`gh` já autenticados
- **Preview:** bind `0.0.0.0`, aceitar host `*.e2b.app`, usar URLs relativas (não `localhost` no browser)
- **Export deve derivar** sempre do canonical state (INV-006)
- **AI não inventa factos:** ambiguidades permanecem `unknown/inferred/unresolved`; geração requer aceitação antes de commit

## Estado Atual

- **Scaffold completo:** `package.json`, `vite.config.ts`, `tailwind.config.js`, `tsconfig.json`, `index.html`, `src/` com 59 módulos transformados, build `328kB (93kB gzip)` OK, `tsc --noEmit` OK
- **Implementado e funcionando:** InfiniteCanvas com pan/ctrl-zoom, 7 Boards (STORY com VisualFrame SVG, SCRIPT Fountain, CHAR com Prompt Lock + references, ENV SOAC, TOOLS, DEPTH 3×3, PROMPT Studio), BoardWindow (drag/focus/minimize/double-expand/resize), Inspector (Frame/Camera/Locks), TimelineBar (raf), AnimaticModal, BibleModal, validação não-bloqueante, Toast/clipboard, TopBar + LeftDock redesenhados, drag-drop global e local, autosave + undo/redo, Mock + Ollama, export .seedance/JSON/CSV/PDF, server Express e Tauri stub
- **Commits pushados:** `b5c8001` (full stack), `419b6d2` (UI ctrl+scroll/double-click/LeftDock/drag-drop), `86db3be` (README rewrite) — rebase com `b8773a9` remoto incluído
- **Preview ativo:** Vite em `0.0.0.0:5173` com HMR, `ready 161ms`
- **Docs:** `README.md` novo, `docs/SDD_v3.1_SPEC.md` preservado, `DEVELOPMENT.md` (stack, rodando, arquitetura, invariantes, formatos)

## Próximos Passos

1. Testes: unit (Fountain, prompt compiler, timeline, depth, mutações, migrações, validação, export) + integração (source → project, lock → prompt, storyboard → timeline/animatic/bible) + interação (pan/zoom/drag/focus/seek/modal)
2. Endurecer: migrations de schema, recovery/autosave format, política auto-save, max project size, asset storage dentro de `.seedance` (zip) — ver Open Decisions SDD §41
3. Performance: virtualização Storyboard/Timeline para 100+ frames, seletores memoizados, evitar persistência em cada frame
4. AI hardening: validar Ollama offline fallback, modelo padrão, geração de imagens local vs URL (decisão §41)
5. Export polimento: templates PDF/Bible finais, `.seedance` asset strategy
6. Tauri packaging: icons (`src-tauri/icons/icon.png` ⚠️ ainda placeholder), diálogos nativos, file associations
7. Docs visuais: screenshots/banner para README, atualizar `DEVELOPMENT.md` com novos gestos (ctrl+scroll, double-click)

## Dúvidas em Aberto

- Open Decisions SDD §41 (15 itens): gramática Fountain exata; abstração final AI provider; config Ollama; armazenamento imagens local vs URL; tamanho máximo projeto; strategy assets `.seedance`; enum completo `CameraMovement`; adapters platform prompt finais; templates PDF/Bible; source docs embedded vs sidecar; SVG-only vs image providers; Tauri file dialog behavior; auto-save policy; recovery format
- ⚠️ Ícone Tauri ainda placeholder; build Tauri não testado neste sandbox (apenas web)
- ⚠️ Server Express depende de `dist/` gerado — fallback `Not built` implementado mas fluxo `pnpm server` após `build` não validado em CI
- ⚠️ Ollama URL padrão `http://localhost:11434` — em preview e2b pode precisar proxy `/api/ollama` (server já tem) mas TopBar ainda aponta direto por padrão
- ⚠️ Drag-drop de imagens usa dataURL base64 — impacto em projetos grandes / `.seedance` size não medido

---

# 🎨 Briefing Criativo: Seedance Forge v3.1

## Conceito Central

> **Continuity engine for cinematic pre-production, with canvas as spatial workspace and project state as source of truth.** Narrativa vira sistema: story beats → cenas → shots → locks de identidade/ambiente → câmera explícita → prompts estruturados → animatic/Bible/PDF. Não é gerador de imagens, é orquestração.

## Referências Visuais & Estilo

- Estilo aprovado: **dark cinematic workspace**, painéis glass/translucent (`rgba(20,20,22,0.85)` + blur 16-20px), glow sutil no focus (`amber 0.35`), metadata técnica compacta, motion contido, hierarquia clara, estética production-tool
- Paletas por entidade: CHAR `ELARA #2a2a2e #c9a86a #6b7f8c` etc, ENV `concrete #9a9a9a amber #f59e0b` etc; Tailwind `forge.bg #09090b`, `forge.panel #141416`, `forge.accent #f59e0b`
- VisualFrame SVG fallback: sky radial gradient, horizonte, sun/moon, silhouette escala por shotType, rule-of-thirds, barras anamorphic

## Tom & Atmosfera

- **Atmosférico sci-fi:** derelict observatory, storm, volumetric shafts, dusty haze, cold dawn — mood **obsessivo, preciso, haunted**; briefing exemplo: `ECLIPSE — eclipse that awakens observatory`; tom técnico, preciso, continuidade > improvisação artística

## Câmera & Composição

- **9 shot types:** ELS, LS, MLS, MS, MCU, CU, ECU, OTS, POV (com labels completos)
- **Lentes:** 16mm, 24mm, 35mm, 50mm, 85mm, 135mm (mínimo)
- **Movimentos:** Static, Pan, Tilt, Dolly, Tracking, Orbital, Crane, Handheld
- **Depth 3×3:** cada célula com `foreground/midground/background` editáveis; seleção vincula a `shotType`
- **Aspect ratios:** 16:9, 2.39:1 (default), 2:1, 4:3, 9:16, 1:1
- **VisualFrame inputs:** shotType, aspect, palette, horizon, subject scale, depth, letterbox

## Iluminação & Cor

- Tipos: **volumetric shafts**, amber practicals, dusty haze, anamorphic flare, soft diffusion (dawn), studio turnaround lighting 35mm
- Temperatura: concreto desaturado + âmbar quente, earth tones, contraste cinematográfico; Tailwind não usa gradients decorativos — só semânticos

## Público-Alvo / Contexto de Uso

- **Primário:** filmmaker, director, art director, storyboard artist, pre-production designer, cinematographer, AI-assisted visual production designer
- **Contexto:** desktop-oriented pre-production (Tauri), também web preview para iteração UI; local/offline first

## Entregas Esperadas

- **Animatic** fullscreen (frame preview, dialogue overlay, timing = storyboard durations)
- **Visual Production Bible** (metadata, characters + Prompt Locks, environments + Env Locks, shot inventory, referências)
- **Exports:** `.seedance` (nativo portátil), JSON, CSV (`Shot ID, Scene, Shot Type, Lens, Movement, Duration, Character, Environment, Action, Prompt`), PDF/print com print CSS dedicado
- **Prompts** platform-aware (midjourney, flux, seedance, runway, kling, veo, generic)
- **Dimensões:** canvas 6000×5000, boards variam (Story 720×520, Prompt 1080×480 etc), `dist/` build 328kB

## O Que Evitar

- Generic SaaS styling, excessive rounded cards, decorative gradients sem propósito, layouts excessivamente centralizados, visual noise, substituir metadata funcional por UI decorativa
- Improvisação artística sobre continuidade; IA não deve inventar factos silenciosamente
- Final NLE/VFX/3D DCC/audio workstation — não é objetivo

---

## 💬 Prompt de Retomada

> Retomar Seedance Forge v3.1 (branch `arena/019fe6d4-seedance-forge-v3-1-arena`, React 19 + Vite 6 + Tailwind 3 + Zustand SSOT + Tauri 2 + Express em `jointkaru-source/Seedance-Forge-v3.1-arena`). Já implementado: canvas 6000×5000 ctrl+scroll zoom cursor-centered, boards 7 (STORY/SCRIPT/CHAR/ENV/TOOLS/DEPTH/PROMPT) com BoardWindow drag/focus/double-click expand/resize, LeftDock 1–7, TopBar redesenhada, drag-drop global/local de .seedance/Fountain/imagens, VisualFrame SVG, Inspector/Timeline/Animatic/Bible, Mock+Ollama, persistência .seedance/JSON/CSV/PDF e autosave. README reescrito (SDD em docs/SDD_v3.1_SPEC.md). Próximo: testes, hardening, asset storage e Tauri packaging — manter invariantes SSOT/locks e operação local-first.

