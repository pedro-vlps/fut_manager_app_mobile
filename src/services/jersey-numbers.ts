export function playerLabel(player: { name: string; jersey_number?: number | null }) {
  return player.jersey_number == null ? player.name : `${player.jersey_number} · ${player.name}`;
}

export function validJerseyNumber(value: string) {
  return value === '' || (/^\d{1,3}$/.test(value) && Number(value) <= 100);
}
