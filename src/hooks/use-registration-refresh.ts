import { useEffect, useRef } from 'react';
import { Event } from '@/services/groups';

// Atualiza a permissão retornada pela API ao abrir ou encerrar as confirmações.
export function useRegistrationRefresh(event: Event | null | undefined, refresh: () => Promise<void>) {
  const callback = useRef(refresh);
  useEffect(() => { callback.current = refresh; }, [refresh]);
  const opens = event?.registration_opens_at;
  const closes = event?.registration_closes_at;
  const scheduled = event?.scheduled_at;
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const boundaries = [opens, closes ?? scheduled].filter(Boolean).map(value => new Date(value!).getTime()).sort((a, b) => a - b);
    function arm() {
      const next = boundaries.find(boundary => boundary > Date.now());
      if (next == null) return;
      timer = setTimeout(() => {
        if (next > Date.now()) { arm(); return; }
        void callback.current();
        arm();
      }, Math.min(next - Date.now() + 150, 2_147_483_647));
    }
    arm();
    return () => clearTimeout(timer);
  }, [opens, closes, scheduled]);
}
