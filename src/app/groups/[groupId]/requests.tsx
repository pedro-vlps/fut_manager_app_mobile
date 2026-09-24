import { useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Button, ui } from '@/components/fut-ui';
import { Empty, GroupScreen, gs } from '@/components/group-screen';
import { useAuth } from '@/contexts/auth';
import { useApiResource } from '@/hooks/use-api-resource';
import { ApiError, request } from '@/services/api';
import { JoinRequest } from '@/services/groups';

export default function RequestsPage() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  return <Requests key={groupId} groupId={groupId} />;
}

function Requests({ groupId }: { groupId: string }) {
  const resource = useApiResource<JoinRequest[]>(`/my-groups/${groupId}/requests`);
  const { session, expireSession } = useAuth();
  const [busy, setBusy] = useState<string>();
  const [feedback, setFeedback] = useState<{ message: string; error: boolean }>();
  const submitting = useRef(false);
  async function review(item: JoinRequest, decision: 'approve' | 'reject') {
    if (!session || submitting.current) return;
    submitting.current = true; setBusy(item.id); setFeedback(undefined);
    try {
      await request(`/my-groups/${groupId}/requests/${item.id}`, { method: 'POST', body: JSON.stringify({ decision }) }, session.access_token);
      resource.update((resource.data ?? []).filter(row => row.id !== item.id));
      setFeedback({ message: decision === 'approve' ? `${item.name} agora faz parte do grupo.` : `Pedido de ${item.name} recusado.`, error: false });
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) expireSession();
      else setFeedback({ message: cause instanceof Error ? cause.message : 'Não foi possível analisar o pedido.', error: true });
    } finally { submitting.current = false; setBusy(undefined); }
  }
  return <GroupScreen title="Pedidos de entrada" subtitle="Somente owners e administradores podem aprovar novos membros." {...resource}>
    {feedback && <Text accessibilityRole="alert" style={feedback.error ? ui.error : gs.success}>{feedback.message}</Text>}
    {resource.data?.length === 0 && <Empty>Nenhum pedido pendente. Puxe para atualizar quando alguém pedir para entrar.</Empty>}
    {resource.data?.map(item => <View key={item.id} style={gs.card}>
      <Text style={gs.heading}>{item.name}</Text>
      <Text style={gs.muted}>Pedido em {new Date(item.created_at).toLocaleDateString('pt-BR')}</Text>
      <Button disabled={!!busy || resource.refreshing} loading={busy === item.id} onPress={() => void review(item, 'approve')}>Aceitar pedido</Button>
      <Button disabled={!!busy || resource.refreshing} onPress={() => void review(item, 'reject')}>Recusar pedido</Button>
    </View>)}
  </GroupScreen>;
}
