import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { palette, ui } from '@/components/fut-ui';
import { Match } from '@/services/lifecycle';

export function MatchTimer({ match, busy, error, control }: {
  match: Match; busy: boolean; error?: string; control?: (action: 'play' | 'pause') => void;
}) {
  return <TimerDisplay key={match.id}
    elapsed={match.timer_elapsed_ms} running={match.timer_running} busy={busy} error={error} control={control} />;
}

function TimerDisplay({ elapsed, running, busy, error, control }: {
  elapsed: number; running: boolean; busy: boolean; error?: string; control?: (action: 'play' | 'pause') => void;
}) {
  const [tick, setTick] = useState({ source: elapsed, milliseconds: elapsed });
  useEffect(() => {
    if (!running) return;
    const started = Date.now();
    const interval = setInterval(() => setTick({ source: elapsed, milliseconds: elapsed + Math.max(0, Date.now() - started) }), 250);
    return () => clearInterval(interval);
  }, [elapsed, running]);
  const seconds = Math.floor((running && tick.source === elapsed ? tick.milliseconds : elapsed) / 1000);
  const formatted = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return <View style={{ gap: 10, alignItems: 'center', paddingVertical: 12 }}>
    <Text numberOfLines={1} style={[ui.eyebrow, { lineHeight: 18, textAlign: 'center' }]}>CRONÔMETRO · {running ? 'EM ANDAMENTO' : 'PAUSADO'}</Text>
    <Text accessibilityLabel={`Tempo de partida: ${formatted}`} style={{ fontSize: 38, fontWeight: '700', color: palette.ink, fontVariant: ['tabular-nums'] }}>{formatted}</Text>
    {control && <>
      <Pressable accessibilityRole="button" accessibilityLabel={running ? 'Pausar cronômetro' : 'Iniciar ou continuar cronômetro'}
        accessibilityState={{ disabled: busy, busy }} disabled={busy} onPress={() => control(running ? 'pause' : 'play')}
        style={[ui.button, { width: 200, maxWidth: '100%', height: 54 }]}>
        <Text numberOfLines={1} style={ui.buttonText}>{running ? 'Ⅱ Pause' : '▶ Play'}</Text>
      </Pressable>
      <Text accessibilityLiveRegion="polite" numberOfLines={2} style={{ height: 40, lineHeight: 20, color: palette.danger, textAlign: 'center' }}>{error || ' '}</Text>
    </>}
  </View>;
}
