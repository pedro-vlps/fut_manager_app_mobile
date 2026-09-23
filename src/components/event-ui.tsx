import { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette, ui } from '@/components/fut-ui';
import { gs } from '@/components/group-screen';
import { Match, Team, actionLabels } from '@/services/lifecycle';

export function Choice({ children, selected, disabled, onPress }: PropsWithChildren<{ selected?: boolean; disabled?: boolean; onPress: () => void }>) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.choice, selected && styles.selected, (disabled || pressed) && { opacity: 0.55 }]}>
    <Text style={{ color: selected ? '#FFFFFF' : palette.ink, fontWeight: '600' }}>{children}</Text>
  </Pressable>;
}
export function Scoreboard({ match }: { match: Match }) {
  return <View style={gs.row}>{match.scores.map(score => <View key={score.team_id} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
    <Text style={[gs.badge, { textAlign: 'center' }]}>{score.name}</Text>
    <Text style={{ fontSize: 44, fontWeight: '800', color: palette.ink }}>{score.goals}</Text>
    {score.result && <Text style={gs.muted}>{score.result === 'draw' ? 'Empate' : score.result === 'win' ? 'Vitória' : 'Derrota'}</Text>}
  </View>)}</View>;
}
export function TeamCards({ teams }: { teams: Team[] }) {
  return <>{teams.map(team => <View key={team.id} style={[gs.card, { borderLeftWidth: 5, borderLeftColor: team.color ?? palette.green }]}>
    <Text style={gs.heading}>{team.name} · {team.players.length}</Text>
    {team.players.map(player => <Text key={player.presence_id} style={ui.body}>{player.name}{player.is_guest ? ' · convidado' : ''}{player.role === 'goalkeeper' ? ' · goleiro' : ''}</Text>)}
  </View>)}</>;
}
export function MatchLog({ match, remove, busy }: { match: Match; remove?: (id: string) => void; busy: boolean }) {
  return <View style={{ gap: 12 }}><Text style={gs.heading}>Súmula</Text>
    {match.actions.length === 0 && <Text style={ui.body}>Nenhum lance registrado nesta partida.</Text>}
    {match.actions.map(action => <View key={action.id} style={[gs.row, { paddingVertical: 8, borderTopWidth: 1, borderColor: palette.border }]}>
      <View style={{ flex: 1, gap: 3 }}><Text style={{ color: palette.ink, fontWeight: '600' }}>{actionLabels[action.action_type]} · {action.player_name}</Text><Text style={gs.muted}>{match.scores.find(s => s.team_id === action.team_id)?.name}{action.minute !== null ? ` · ${action.minute} min` : ''}</Text></View>
      {remove && <Pressable accessibilityRole="button" accessibilityLabel={`Remover ${actionLabels[action.action_type]} de ${action.player_name}`} disabled={busy} onPress={() => remove(action.id)} style={{ padding: 12 }}><Text style={{ color: palette.danger }}>Remover</Text></Pressable>}
    </View>)}
  </View>;
}
export const styles = StyleSheet.create({
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { borderWidth: 1, borderColor: palette.border, backgroundColor: palette.paper, paddingVertical: 13, paddingHorizontal: 15, borderRadius: 14 },
  selected: { backgroundColor: palette.green, borderColor: palette.green },
});
