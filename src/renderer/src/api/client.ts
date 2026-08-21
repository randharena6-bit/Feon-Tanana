export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

const TOKEN_KEY = 'ft_token'
const USER_KEY = 'ft_user'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

export const tokenStore = {
  get(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  },
  set(token: string): void {
    localStorage.setItem(TOKEN_KEY, token)
  },
  clear(): void {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth = true, headers, ...rest } = options
  const finalHeaders: Record<string, string> = {
    ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
    ...((headers as Record<string, string>) ?? {})
  }

  if (auth) {
    const token = tokenStore.get()
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`
    }
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, { ...rest, headers: finalHeaders })
  } catch {
    throw new ApiError(0, 'Impossible de joindre le serveur. Vérifiez que le backend est démarré.')
  }

  if (response.status === 204) {
    return undefined as T
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const detail =
      data && typeof data === 'object' && 'detail' in data
        ? String((data as { detail: unknown }).detail)
        : `Erreur ${response.status}`
    throw new ApiError(response.status, detail)
  }

  return data as T
}

export const api = {
  get<T>(path: string, auth = true): Promise<T> {
    return request<T>(path, { method: 'GET', auth })
  },
  post<T>(path: string, body?: unknown, auth = true): Promise<T> {
    return request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      auth
    })
  }
}
