import { API_BASE, api } from './client'

export interface DetectionResult {
  sign: string
  confidence: number
  mode: string
}

export function detectFrame(imageDataUrl: string): Promise<DetectionResult> {
  return api.post<DetectionResult>('/detect', { image: imageDataUrl }, false)
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/detect/health`)
    if (!res.ok) return false
    const data = (await res.json()) as { status?: string }
    return data.status === 'ok'
  } catch {
    return false
  }
}
