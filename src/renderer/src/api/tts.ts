import { API_BASE, api } from './client'

export interface TTSResponse {
  audio_path: string
}

export function synthesize(text: string, lang = 'fr'): Promise<TTSResponse> {
  return api.post<TTSResponse>('/tts', { text, lang })
}

export function audioUrl(): string {
  return `${API_BASE}/tts/audio`
}
