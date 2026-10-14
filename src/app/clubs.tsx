import { TrophyIcon } from '@/components/trophy-icon';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { GroupScreen, gs } from '@/components/group-screen';
import { Button, palette, ui } from '@/components/fut-ui';
import { useAuth } from '@/contexts/auth';
import { useApiResource } from '@/hooks/use-api-resource';
import { useMutation } from '@/hooks/use-mutation';
import { Club, Invitation } from '@/services/championships';
import { Dropdown } from '@/components/dropdown';
import { JerseyNumberField } from '@/components/jersey-number-field';
import { playerLabel } from '@/services/jersey-numbers';

function Team({ club, refresh }: { club: Club; refresh: () => Promise<void> }) {
  const { session } = useAuth();
  const [email, setEmail] = useState('');
  const action = useMutation();
  return <View style={gs.card}>
    <Text style={gs.heading}>{club.name}</Text>
    <Text style={gs.muted}>Goleiro titular: {club.members.find(member => member.id === club.starting_goalkeeper_id)?.name ?? 'Não definido'}</Text>
    {club.members.map(member => <View key={member.id} style={{ gap: 8 }}>
      <Text style={ui.body}>{playerLabel(member)} · {member.status === 'accepted' ? 'Confirmado' : member.status === 'pending' ? 'Convite pendente' : member.status === 'requested' ? 'Pedido de entrada' : 'Recusado'}</Text>
      {session?.profile.id === club.owner_id && member.status === 'accepted' && <JerseyNumberField name={member.name} number={member.jersey_number} busy={action.busy}
        submit={jersey_number => action.mutate(`/clubs/${club.id}/members/${member.id}/jersey-number`, { jersey_number }, refresh)} />}
    </View>)}
    <Text style={gs.heading}>Sala de troféus</Text>
    {!club.trophies.length && <Text style={gs.muted}>Este time ainda não conquistou títulos.</Text>}
    {club.trophies.map(trophy => <View key={trophy.championship_id} style={gs.row}><TrophyIcon category={trophy.category} /><Text style={ui.body}>{trophy.name} · {trophy.season}</Text></View>)}
    {session?.profile.id === club.owner_id && <>
      <Dropdown label="Goleiro titular padrão" value={club.starting_goalkeeper_id ?? ''} disabled={action.busy}
        options={[{ value: '', label: 'Sem titular definido' }, ...club.members.filter(member => member.status === 'accepted').map(member => ({ value: member.id, label: member.name }))]}
        onChange={value => void action.mutate(`/clubs/${club.id}/goalkeeper`, { goalkeeper_id: value || null }, refresh)} />
      <Text style={gs.muted}>O titular será usado nos campeonatos e nos jogos futuros em que ele pertença ao elenco inscrito.</Text>
      <Text selectable style={gs.badge}>Código de convite: {club.code}</Text>
      <Button loading={action.busy} onPress={() => void action.mutate(`/clubs/${club.id}/code/rotate`, {}, refresh)}>Gerar novo código</Button>
      {club.members.filter(member => member.status === 'requested').map(member => <View key={member.id} style={gs.card}>
        <Text style={ui.body}>{member.name} pediu para entrar</Text>
        <Button disabled={action.busy} onPress={() => void action.mutate(`/clubs/${club.id}/members/${member.id}/review`, { accept: true }, refresh)}>Aceitar pedido</Button>
        <Button disabled={action.busy} onPress={() => void action.mutate(`/clubs/${club.id}/members/${member.id}/review`, { accept: false }, refresh)}>Recusar pedido</Button>
      </View>)}
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
  const [code, setCode] = useState('');
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
      <Text style={gs.heading}>Entrar em um time com convite</Text>
      <TextInput accessibilityLabel="Código do time" placeholder="Código do time" placeholderTextColor={palette.muted} style={ui.input} value={code} maxLength={6} autoCapitalize="characters" onChangeText={value => setCode(value.replace(/[^a-z0-9]/gi, '').toUpperCase())} />
      <Button loading={action.busy} disabled={code.length !== 6} onPress={() => void action.mutate('/club-discovery/join', { code }, async () => { setCode(''); await refresh(); })}>Pedir entrada</Button>
      <Text style={gs.muted}>O administrador aprova sua entrada no elenco.</Text>
    </View>
    <View style={gs.card}>
      <Text style={gs.heading}>Criar um time</Text>
      <TextInput accessibilityLabel="Nome do time" style={ui.input} placeholder="Nome do time" placeholderTextColor={palette.muted} value={name} onChangeText={setName} maxLength={80} editable={!action.busy} />
      <Button loading={action.busy} disabled={!name.trim()} onPress={() => void action.mutate('/clubs', { name: name.trim() }, async () => { setName(''); await refresh(); })}>Criar time</Button>
    </View>
    {(clubs.data ?? []).map(club => <Team key={club.id} club={club} refresh={clubs.refresh} />)}
  </GroupScreen>;
}
