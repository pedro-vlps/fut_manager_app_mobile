import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { ApiError, request } from '@/services/api';

export function useApiResource<T>(path: string) {
  const { session, expireSession } = useAuth();
  const token = session?.access_token;
  const [result, setResult] = useState<{ path: string; data?: T; error?: string }>();
  const [refreshing, setRefreshing] = useState(false);
  const generation = useRef({ value: 0 });
  const load = useCallback(() => {
    if (!token) return Promise.resolve();
    const id = ++generation.current.value;
    return request<T>(path, {}, token).then(data => {
      if (id === generation.current.value) setResult({ path, data });
    }).catch((error: unknown) => {
      if (id !== generation.current.value) return;
      if (error instanceof ApiError && error.status === 401) expireSession();
      else setResult({ path, error: error instanceof Error ? error.message : 'Não foi possível carregar os dados.' });
    }).finally(() => { if (id === generation.current.value) setRefreshing(false); });
  }, [path, token, expireSession]);
  useFocusEffect(useCallback(() => {
    const counter = generation.current;
    void load();
    return () => { counter.value++; };
  }, [load]));
  function refresh() { setRefreshing(true); return load(); }
  const current = result?.path === path ? result : undefined;
  function update(data: T) {
    generation.current.value++;
    setResult({ path, data });
    setRefreshing(false);
  }
  return { data: current?.data, error: current?.error, loading: !current, refreshing, refresh, update };
}
