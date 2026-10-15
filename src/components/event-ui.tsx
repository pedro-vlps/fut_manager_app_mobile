import { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette, ui } from '@/components/fut-ui';
import { gs } from '@/components/group-screen';
import { Match, Team, actionLabels } from '@/services/lifecycle';
import { JerseyNumberField } from '@/components/jersey-number-field';
import { playerLabel } from '@/services/jersey-numbers';
import { ResponsiveGrid } from '@/components/responsive-grid';

export function Choice({ children, selected, disabled, onPress }: PropsWithChildren<{ selected?: boolean; disabled?: boolean; onPress: () => void }>) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.choice, selected && styles.selected, (disabled || pressed) && { opacity: 0.55 }]}>
    <Text style={{ color: selected ? '#FFFFFF' : palette.ink, fontWeight: '600' }}>{children}</Text>
  </Pressable>;
}
export function Scoreboard({ match }: { match: Pick<Match, 'scores'> }) {
  return <View style={gs.row}>{match.scores.map(score => <View key={score.team_id} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
    <Text style={[gs.badge, { textAlign: 'center' }]}>{score.name}</Text>
    <Text style={{ fontSize: 44, fontWeight: '800', color: palette.ink }}>{score.goals}</Text>
    {score.result && <Text style={gs.muted}>{score.result === 'draw' ? 'Empate' : score.result === 'win' ? 'Vitória' : 'Derrota'}</Text>}
  </View>)}</View>;
}
export function TeamCards({ teams, ratings = {}, busy = false, setNumber }: {
  teams: Team[]; ratings?: Record<string, number | null>; busy?: boolean;
  setNumber?: (teamId: string, presenceId: string, number: number | null) => Promise<boolean>;
}) {
  return <ResponsiveGrid maxColumns={2}>{teams.map(team => <View key={team.id} style={[gs.card, { borderLeftWidth: 5, borderLeftColor: team.color ?? palette.green }]}>
    <Text style={gs.heading}>{team.name} · {team.players.length}</Text>
    {team.players.map(player => <View key={player.presence_id} style={{ gap: 8 }}><View style={[gs.row, { flexWrap: 'wrap' }]}>
      <Text style={[ui.body, { flex: 1 }]}>{playerLabel(player)}{player.is_guest ? ' · convidado' : ''}{player.role === 'goalkeeper' ? ' · goleiro' : ''}</Text>
      {Object.prototype.hasOwnProperty.call(ratings, player.person_id) && <Text style={gs.badge}>
        {ratings[player.person_id] === null ? 'Sem avaliação' : `Nota ${ratings[player.person_id]!.toFixed(1).replace('.', ',')}`}
      </Text>}
    </View>
      {setNumber && <JerseyNumberField name={player.name} number={player.jersey_number} busy={busy}
        submit={number => setNumber(team.id, player.presence_id, number)} />}
    </View>)}
  </View>)}</ResponsiveGrid>;
}
export function MatchLog({ match, remove, busy }: { match: Pick<Match, 'scores' | 'actions'>; remove?: (id: string) => void; busy: boolean }) {
  const grouped = new Map<string, { action: Match['actions'][number]; ids: string[] }>();
  for (const action of match.actions) {
    const key = `${action.team_id}-${action.presence_id ?? action.person_id ?? action.id}-${action.action_type}-${action.auto_generated ? 'auto' : 'manual'}`;
    const group = grouped.get(key);
    if (group) group.ids.push(action.id);
    else grouped.set(key, { action, ids: [action.id] });
  }
  const plural = { goal: 'Gols', assist: 'Assistências', own_goal: 'Gols contra', yellow_card: 'Cartões amarelos', red_card: 'Cartões vermelhos' };
  return <View style={{ gap: 12 }}><Text style={gs.heading}>Súmula</Text>
    {match.actions.length === 0 && <Text style={ui.body}>Nenhum lance registrado nesta partida.</Text>}
    {[...grouped.values()].map(({ action, ids }) => <View key={action.id} style={[gs.row, { paddingVertical: 8, borderTopWidth: 1, borderColor: palette.border }]}>
      <View style={{ flex: 1, gap: 3 }}><Text style={{ color: palette.ink, fontWeight: '600' }}>{ids.length}x {ids.length > 1 ? plural[action.action_type] : actionLabels[action.action_type]} · {action.player_name}</Text><Text style={gs.muted}>{match.scores.find(s => s.team_id === action.team_id)?.name}{ids.length === 1 && action.minute !== null ? ` · ${action.minute} min` : ''}</Text></View>
      {action.auto_generated && <Text style={gs.muted}>Automático · 2º amarelo</Text>}
      {remove && !action.auto_generated && <Pressable accessibilityRole="button" accessibilityLabel={`Remover ${actionLabels[action.action_type]} de ${action.player_name}`} disabled={busy} onPress={() => remove(ids[ids.length - 1])} style={{ padding: 12 }}><Text style={{ color: palette.danger }}>Remover 1</Text></Pressable>}
    </View>)}
  </View>;
}
export const styles = StyleSheet.create({
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { borderWidth: 1, borderColor: palette.border, backgroundColor: palette.paper, paddingVertical: 13, paddingHorizontal: 15, borderRadius: 14 },
  selected: { backgroundColor: palette.green, borderColor: palette.green },
});
