import { useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Switch, Text, TextInput, View } from 'react-native';
import { Button, palette, ui } from '@/components/fut-ui';
import { GroupScreen, gs } from '@/components/group-screen';
import { useAuth } from '@/contexts/auth';
import { useApiResource } from '@/hooks/use-api-resource';
import { ApiError, request } from '@/services/api';
import { Dropdown } from '@/components/dropdown';
import { EventScheduler } from '@/components/event-scheduler';
import { SeasonSettings, eventDate } from '@/services/groups';
import { DrawSettings } from '@/components/draw-settings';

export default function SettingsPage() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const resource = useApiResource<SeasonSettings>(`/my-groups/${groupId}/settings`);
  const [saved, setSaved] = useState(false);
  return <GroupScreen title="Configurações do grupo" subtitle="Agende os eventos e organize os rankings por temporadas." {...resource}>
    {saved && <Text accessibilityRole="alert" style={gs.success}>Configurações salvas.</Text>}
    {resource.data && <SettingsForm key={`${groupId}-${resource.data.enabled}-${resource.data.duration_days}-${resource.data.mode}-${resource.data.months}-${resource.data.day}-${resource.data.fixed_end}-${resource.data.current_season?.id}`} groupId={groupId} settings={resource.data} onSave={data => { resource.update(data); setSaved(true); }} onEdit={() => setSaved(false)} />}
    {resource.data?.can_manage && <><DrawSettings key={`draw-${groupId}`} groupId={groupId} /><EventScheduler key={groupId} groupId={groupId} /></>}
  </GroupScreen>;
}

function SettingsForm({ groupId, settings, onSave, onEdit }: { groupId: string; settings: SeasonSettings; onSave: (data: SeasonSettings) => void; onEdit: () => void }) {
  const { session, expireSession } = useAuth();
  const [enabled, setEnabled] = useState(settings.enabled);
  const [days, setDays] = useState(String(settings.duration_days));
  const [mode, setMode] = useState(settings.mode);
  const [months, setMonths] = useState(String(settings.months));
  const [day, setDay] = useState(String(settings.day));
  const [fixedDate, setFixedDate] = useState(settings.fixed_end ? new Date(settings.fixed_end).toLocaleDateString('pt-BR') : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const submitting = useRef(false);
  const [openedAt] = useState(() => Date.now());
  function fixedEnd() {
    const parts = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(fixedDate);
    if (!parts) return null;
    const [, d, m, y] = parts.map(Number);
    const date = new Date(y, m - 1, d);
    return date.getDate() === d && date.getMonth() === m - 1 && date.getFullYear() === y && date.getTime() > openedAt ? date : null;
  }
  const validDays = /^\d+$/.test(days) && Number(days) >= 1 && Number(days) <= 3650;
  const valid = !enabled || (mode === 'days' ? validDays : mode === 'months'
    ? /^\d+$/.test(months) && Number(months) >= 1 && Number(months) <= 120 && /^\d+$/.test(day) && Number(day) >= 1 && Number(day) <= 31 : !!fixedEnd());
  async function save() {
    if (!session || !valid || submitting.current) return;
    if (enabled && mode === 'fixed' && (fixedEnd()?.getTime() ?? 0) <= Date.now()) { setError('Escolha uma data futura.'); return; }
    submitting.current = true; setBusy(true); setError(undefined); onEdit();
    try {
      const data = await request<SeasonSettings>(`/my-groups/${groupId}/settings`, { method: 'POST', body: JSON.stringify({ enabled, duration_days: validDays ? Number(days) : 30, mode, months: Number(months) || 3, day: Number(day) || 10, fixed_end: mode === 'fixed' ? fixedEnd()?.toISOString() ?? null : null, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo' }) }, session.access_token);
      onSave(data);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) expireSession();
      else setError(cause instanceof Error ? cause.message : 'Não foi possível salvar.');
    } finally { submitting.current = false; setBusy(false); }
  }
  return <>
    <View style={gs.card}>
      <View style={gs.row}><Text style={[gs.heading, { flex: 1 }]}>Usar temporadas</Text><Switch accessibilityLabel="Usar temporadas" value={enabled} onValueChange={value => { setEnabled(value); onEdit(); }} disabled={busy || !settings.can_manage} trackColor={{ true: palette.green }} /></View>
      <Text style={ui.body}>Ao ativar, uma temporada começa agora. Escolha como definir seu encerramento.</Text>
      {enabled && <>
        <Dropdown label="Duração da temporada" value={mode} disabled={busy || !settings.can_manage} onChange={value => { setMode(value as SeasonSettings['mode']); onEdit(); }} options={[{ value: 'days', label: 'Quantidade de dias' }, { value: 'months', label: 'Dia fixo a cada X meses' }, { value: 'fixed', label: 'Data específica (sem repetição)' }]} />
        {mode === 'months' && <>
          <Text style={ui.eyebrow}>ENCERRAR NO DIA</Text>
          <TextInput accessibilityLabel="Dia de encerramento" style={ui.input} value={day} onChangeText={value => { setDay(value); onEdit(); }} keyboardType="number-pad" maxLength={2} editable={!busy && settings.can_manage} />
          <Text style={ui.eyebrow}>A CADA QUANTOS MESES?</Text>
          <TextInput accessibilityLabel="Intervalo em meses" style={ui.input} value={months} onChangeText={value => { setMonths(value); onEdit(); }} keyboardType="number-pad" maxLength={3} editable={!busy && settings.can_manage} />
          <Text style={gs.muted}>Exemplo: dia 10 a cada 3 meses. O primeiro encerramento será no dia escolhido, no mês atual mais o intervalo. Meses sem esse dia usam o último dia do mês. A virada ocorre à meia-noite.</Text>
        </>}
        {mode === 'fixed' && <>
          <Text style={ui.eyebrow}>DATA DE ENCERRAMENTO · DD/MM/AAAA</Text>
          <TextInput accessibilityLabel="Data de encerramento da temporada" style={ui.input} value={fixedDate} placeholder="10/12/2026" keyboardType="number-pad" maxLength={10} editable={!busy && settings.can_manage} onChangeText={value => { setFixedDate(value.replace(/\D/g, '').slice(0, 8).replace(/^(\d{2})(\d)/, '$1/$2').replace(/^(\d{2}\/\d{2})(\d)/, '$1/$2')); onEdit(); }} />
          <Text style={gs.muted}>Encerra no início desta data, à meia-noite, sem criar outra temporada. Depois, o ranking volta a acumular todas as partidas.</Text>
        </>}
        {mode === 'days' && <>
        <Text style={ui.eyebrow}>DURAÇÃO EM DIAS</Text>
        <TextInput accessibilityLabel="Duração da temporada em dias" style={ui.input} value={days} keyboardType="number-pad" onChangeText={value => { setDays(value); onEdit(); }} editable={!busy && settings.can_manage} maxLength={4} />
        {!valid && <Text style={ui.error}>Informe um número inteiro entre 1 e 3650 dias.</Text>}
        <Text style={gs.muted}>Exemplos: 7 dias, 30 dias ou 365 dias. Alterações de duração valem para a próxima temporada.</Text>
        </>}
        {!valid && mode !== 'days' && <Text style={ui.error}>Informe um dia de 1 a 31 e intervalo de 1 a 120 meses, ou uma data futura válida.</Text>}
        {mode !== 'days' && <Text style={gs.muted}>Ao salvar uma alteração, a data de encerramento da temporada atual será atualizada. Seu início e os registros anteriores serão preservados.</Text>}
      </>}
      {settings.current_season && <>
        <Text style={gs.badge}>Temporada atual: {settings.current_season.number}</Text>
        <Text style={ui.body}>{eventDate(settings.current_season.starts_at)} → {eventDate(settings.current_season.ends_at)}</Text>
      </>}
      {settings.enabled && !enabled && <Text style={ui.body}>Ao salvar, a temporada atual será encerrada e preservada no histórico. O ranking voltará a acumular todas as partidas.</Text>}
      <Text style={gs.muted}>Partidas contam na temporada em que são finalizadas. O histórico de jogos nunca é apagado.</Text>
      {settings.can_manage ? <Button onPress={() => void save()} loading={busy} disabled={!valid}>Salvar configurações</Button> : <Text style={gs.muted}>Somente owners e administradores podem alterar estas configurações.</Text>}
    </View>
    {error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}
  </>;
}
