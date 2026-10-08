import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { GroupScreen, gs } from '@/components/group-screen';
import { Button, palette, ui } from '@/components/fut-ui';
import { useAuth } from '@/contexts/auth';
import { useApiResource } from '@/hooks/use-api-resource';
import { useMutation } from '@/hooks/use-mutation';
import { Club, Invitation } from '@/services/championships';

function Team({ club, refresh }: { club: Club; refresh: () => Promise<void> }) {
  const { session } = useAuth();
  const [email, setEmail] = useState('');
  const action = useMutation();
  return <View style={gs.card}>
    <Text style={gs.heading}>{club.name}</Text>
    {club.members.map(member => <Text key={member.id} style={ui.body}>{member.name} · {member.status === 'accepted' ? 'Confirmado' : member.status === 'pending' ? 'Convite pendente' : 'Recusado'}</Text>)}
    {session?.profile.id === club.owner_id && <>
      <TextInput style={ui.input} accessibilityLabel={`E-mail do jogador para ${club.name}`} placeholder="E-mail do jogador" placeholderTextColor={palette.muted} value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" editable={!action.busy} />
      <Button loading={action.busy} disabled={!email.trim()} onPress={() => void action.mutate(`/clubs/${club.id}/invitations`, { email: email.trim() }, async () => { setEmail(''); await refresh(); })}>Convidar jogador</Button>
      <Text style={gs.muted}>O convite aparece em Meus times na conta do jogador. Somente quem aceitar fará parte do elenco.</Text>
    </>}
    {action.error && <Text accessibilityRole="alert" style={ui.error}>{action.error}</Text>}
  </View>;
}

export default function Clubs() {
  const clubs = useApiResource<Club[]>('/clubs');
  const invitations = useApiResource<Invitation[]>('/club-invitations');
  const [name, setName] = useState('');
  const action = useMutation();
  async function refresh() { await Promise.all([clubs.refresh(), invitations.refresh()]); }
  return <GroupScreen title="Meus times" eyebrow="FUTMANAGER · ELENCOS" subtitle="Crie seu time, convide jogadores e participe dos campeonatos." loading={clubs.loading || invitations.loading} error={clubs.error || invitations.error} refreshing={clubs.refreshing || invitations.refreshing} refresh={() => void refresh()}>
    {action.error && <Text accessibilityRole="alert" style={ui.error}>{action.error}</Text>}
    {(invitations.data ?? []).map(invite => <View key={invite.id} style={gs.card}>
      <Text style={ui.eyebrow}>CONVITE PARA JOGAR</Text><Text style={gs.heading}>{invite.club_name}</Text>
      <Button loading={action.busy} onPress={() => void action.mutate(`/club-invitations/${invite.id}`, { accept: true }, refresh)}>Aceitar convite</Button>
      <Button disabled={action.busy} onPress={() => void action.mutate(`/club-invitations/${invite.id}`, { accept: false }, refresh)}>Recusar</Button>
    </View>)}
    <View style={gs.card}>
      <Text style={gs.heading}>Criar um time</Text>
      <TextInput accessibilityLabel="Nome do time" style={ui.input} placeholder="Nome do time" placeholderTextColor={palette.muted} value={name} onChangeText={setName} maxLength={80} editable={!action.busy} />
      <Button loading={action.busy} disabled={!name.trim()} onPress={() => void action.mutate('/clubs', { name: name.trim() }, async () => { setName(''); await refresh(); })}>Criar time</Button>
    </View>
    {(clubs.data ?? []).map(club => <Team key={club.id} club={club} refresh={clubs.refresh} />)}
  </GroupScreen>;
}
