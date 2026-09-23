import { Platform } from 'react-native';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? '' : '')).replace(/\/$/, '');
export type Profile = { id: string; name: string; email: string; positions: Record<string, string[]> };
export type Session = { access_token: string; profile: Profile };
export type Group = { id: string; name: string; description: string | null; role: 'owner' | 'admin' | 'member' };

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options, signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new ApiError(typeof body?.detail === 'string' ? body.detail : 'Não foi possível concluir a solicitação. Tente novamente.', response.status);
    }
    return response.status === 204 ? undefined as T : await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error('Não foi possível conectar ao servidor. Confira sua conexão e tente novamente.');
  } finally { clearTimeout(timeout); }
}
