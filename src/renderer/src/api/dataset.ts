import { api } from './client'

export interface RecordingResponse {
  label: string
  frames_saved: number
  path: string
}

export function recordImages(label: string, images: string[]): Promise<RecordingResponse> {
  return api.post<RecordingResponse>('/dataset/record_images', { label, images })
}

export function listLabels(): Promise<string[]> {
  return api.get<string[]>('/dataset/labels')
}

export function getStats(): Promise<Record<string, number>> {
  return api.get<Record<string, number>>('/dataset/stats')
}
