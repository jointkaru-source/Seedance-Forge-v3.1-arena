export const uid = (p='id') => `${p}_${Math.random().toString(36).slice(2,9)}_${Date.now().toString(36)}`
export const nowIso = () => new Date().toISOString()
