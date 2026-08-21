import { api } from './client'

export interface User {
  id: number
  username: string
  email: string
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export function register(username: string, email: string, password: string): Promise<AuthResponse> {
  return api.post<AuthResponse>('/auth/register', { username, email, password }, false)
}

export function login(username: string, password: string): Promise<AuthResponse> {
  return api.post<AuthResponse>('/auth/login', { username, password }, false)
}

export function getMe(): Promise<User> {
  return api.get<User>('/auth/me')
}
