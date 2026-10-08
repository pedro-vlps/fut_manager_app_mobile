import { useRef, useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { ApiError, request } from '@/services/api';

export function useMutation() {
  const { session, expireSession } = useAuth();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  async function mutate<T>(path: string, body: unknown, success: (result: T) => void | Promise<void>) {
    if (!session || lock.current) return false;
    lock.current = true; setBusy(true); setError(undefined);
    try {
      const result = await request<T>(path, { method: 'POST', ...(body === undefined ? {} : { body: JSON.stringify(body) }) }, session.access_token);
      await success(result);
      return true;
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) expireSession();
      else setError(cause instanceof Error ? cause.message : 'Não foi possível concluir.');
      return false;
    } finally { lock.current = false; setBusy(false); }
  }
  return { busy, error, mutate };
}
