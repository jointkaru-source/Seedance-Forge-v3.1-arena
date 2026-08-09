import { useStore } from '../store/useStore'

export function ToastStack(){
  const toasts = useStore(s=>s.toasts)
  const dismiss = useStore(s=>s.dismissToast)
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t=>(
        <div key={t.id} onClick={()=>dismiss(t.id)} className={`pointer-events-auto min-w-[260px] max-w-[380px] px-4 py-3 rounded-xl text-sm font-medium shadow-2xl border flex items-center gap-3 cursor-pointer transition-all
          ${t.type==='success'?'bg-emerald-950/90 border-emerald-800 text-emerald-100':''
          }
          ${t.type==='error'?'bg-red-950/90 border-red-900 text-red-100':''}
          ${t.type==='info'?'bg-zinc-900 border-white/10 text-zinc-100':''}
        `} style={{backdropFilter:'blur(12px)'}}>
          <span className={`w-2 h-2 rounded-full shrink-0 ${t.type==='success'?'bg-emerald-400': t.type==='error'?'bg-red-400':'bg-amber-400'}`} />
          <span className="leading-snug">{t.msg}</span>
        </div>
      ))}
    </div>
  )
}
