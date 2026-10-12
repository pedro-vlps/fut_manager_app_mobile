import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, ui } from './fut-ui';
import { gs } from './group-screen';
import { useAuth } from '@/contexts/auth';
import { useApiResource } from '@/hooks/use-api-resource';
import { useMutation } from '@/hooks/use-mutation';
import { ChampionshipDetail, Club } from '@/services/championships';

export function ChampionshipRegistration({ data, update }: { data: ChampionshipDetail; update: (data: ChampionshipDetail) => void }) {
  const clubs = useApiResource<Club[]>('/clubs');
  const { session } = useAuth();
  const action = useMutation();
  const owned = clubs.data?.filter(club => club.owner_id === session?.profile.id) ?? [];
  if (data.status !== 'registration') return <Text style={ui.body}>As inscrições deste campeonato estão encerradas.</Text>;
  return <>
    <View style={gs.card}>
      <Text style={gs.heading}>Inscrever meu time · {data.entries.length}/{data.capacity} vagas</Text>
      <Text style={ui.body}>O criador inscreve o time com os jogadores que já aceitaram o convite. É necessário ter ao menos 2 jogadores, incluindo o criador. Cada jogador só pode defender um time nesta edição.</Text>
      <Text style={gs.muted}>O elenco fica registrado na inscrição. Antes do início, retire e reinscreva o time se precisar atualizar os jogadores.</Text>
      <Button onPress={() => router.push('/clubs')}>Gerenciar meus times e convites</Button>
      {clubs.error && <><Text style={ui.error}>{clubs.error}</Text><Button onPress={() => void clubs.refresh()}>Recarregar meus times</Button></>}
      {clubs.loading && <Text style={ui.body}>Carregando times…</Text>}
      {!clubs.loading && !clubs.error && !owned.length && <Text style={ui.body}>Crie um time para inscrevê-lo neste campeonato.</Text>}
      {owned.map(club => {
        const registered = data.entries.some(entry => entry.club_id === club.id);
        return <Button key={club.id} loading={action.busy} disabled={!registered && data.entries.length >= data.capacity} onPress={() => void action.mutate<ChampionshipDetail>(registered ? `/championships/${data.id}/entries/${club.id}/withdraw` : `/championships/${data.id}/entries`, registered ? undefined : { club_id: club.id }, update)}>{registered ? 'Retirar' : 'Inscrever'} {club.name}</Button>;
      })}
    </View>
    {action.error && <Text accessibilityRole="alert" style={ui.error}>{action.error}</Text>}
    {data.owner_id === session?.profile.id && <View style={gs.card}>
      <Text style={gs.heading}>Iniciar campeonato</Text>
      <Text style={ui.body}>Preencha as {data.capacity} vagas para iniciar a disputa.</Text>
      {data.format === 'groups_knockout' && <Button onPress={() => router.push({ pathname: '/championships/history', params: { championshipId: data.id, section: 'groups' } })}>Conferir e editar grupos</Button>}
      <Button loading={action.busy} disabled={data.entries.length !== data.capacity || (data.format === 'cascade' && data.capacity !== 4)} onPress={() => void action.mutate<ChampionshipDetail>(`/championships/${data.id}/start`, undefined, update)}>Encerrar inscrições e iniciar campeonato</Button>
    </View>}
  </>;
}
