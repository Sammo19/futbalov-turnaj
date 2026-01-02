// Slovak declension helpers

export function declineTip(count: number): string {
  if (count === 1) return 'tip';
  if (count >= 2 && count <= 4) return 'tipy';
  return 'tipov';
}

export function declineHlas(count: number): string {
  if (count === 1) return 'hlas';
  if (count >= 2 && count <= 4) return 'hlasy';
  return 'hlasov';
}

export function declineZapas(count: number): string {
  if (count === 1) return 'zápas';
  if (count >= 2 && count <= 4) return 'zápasy';
  return 'zápasov';
}

export function declineTim(count: number): string {
  if (count === 1) return 'tím';
  if (count >= 2 && count <= 4) return 'tímy';
  return 'tímov';
}

export function declineUcastnik(count: number): string {
  if (count === 1) return 'účastník';
  if (count >= 2 && count <= 4) return 'účastníci';
  return 'účastníkov';
}

export function declineVybrane(count: number): string {
  if (count === 1) return 'vybraný';
  if (count >= 2 && count <= 4) return 'vybrané';
  return 'vybraných';
}
