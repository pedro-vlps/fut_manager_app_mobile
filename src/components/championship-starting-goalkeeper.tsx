import { Text, View } from 'react-native';
import { useAuth } from '@/contexts/auth';
import { useMutation } from '@/hooks/use-mutation';
import { ChampionshipDetail, Entry } from '@/services/championships';
import { Dropdown } from './dropdown';
import { ui } from './fut-ui';
import { gs } from './group-screen';

export function ChampionshipStartingGoalkeeper({ data, entry, update, disabled = false }: {
  data: ChampionshipDetail; entry: Entry; update: (data: ChampionshipDetail) => void; disabled?: boolean;
}) {
  const { session } = useAuth();
  const action = useMutation();
  const editable = entry.owner_id === session?.profile.id && data.status !== 'finished' && !entry.disqualified && !disabled;
  return <View style={gs.card}>
    <Text style={gs.heading}>Goleiro titular · {entry.name}</Text>
    <Text style={ui.body}>{entry.players.find(player => player.id === entry.starting_goalkeeper_id)?.name ?? 'Titular não definido'}</Text>
    {editable && <>
      <Text style={gs.muted}>O titular é preenchido automaticamente nos jogos que ainda não começaram. Durante a partida, comunique a substituição ao organizador.</Text>
      <Dropdown label="Definir titular nesta edição" value={entry.starting_goalkeeper_id ?? ''} disabled={action.busy}
        options={[{ value: '', label: 'Sem titular definido' }, ...entry.players.map(player => ({ value: player.id, label: player.name }))]}
        onChange={value => void action.mutate<ChampionshipDetail>(`/championships/${data.id}/clubs/${entry.club_id}/goalkeeper`, { goalkeeper_id: value || null }, update)} />
    </>}
    {action.error && <Text accessibilityRole="alert" style={ui.error}>{action.error}</Text>}
  </View>;
}
