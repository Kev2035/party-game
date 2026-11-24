// Premi buffi mostrati dopo il podio. `score(stats)` -> numero (più alto vince),
// `min` è il valore minimo per meritarsi il premio. `detail` descrive il numero.
export const awards = [
  { id: 'mostChallenged', emoji: '🔥', title: 'Il più sfidato', min: 1, score: (s) => s.played, detail: (n) => `${n} sfide giocate` },
  {
    id: 'sniper',
    emoji: '🎯',
    title: 'Il cecchino',
    min: 0.01,
    score: (s) => (s.played >= 2 ? s.wins / s.played : 0),
    detail: (n, s) => `${s.wins} vittorie su ${s.played} (${Math.round(n * 100)}%)`,
  },
  { id: 'quarrelsome', emoji: '🤥', title: 'Il più litigioso', min: 1, score: (s) => s.disagreements, detail: (n) => `${n} ${n === 1 ? 'disaccordo' : 'disaccordi'}` },
  { id: 'bloodhound', emoji: '🔍', title: 'Il segugio', min: 1, score: (s) => s.qrFound, detail: (n) => `${n} QR ${n === 1 ? 'trovato' : 'trovati'}` },
  { id: 'bountyHunter', emoji: '💰', title: 'Il cacciatore di taglie', min: 1, score: (s) => s.bounties, detail: (n) => `${n} ${n === 1 ? 'taglia incassata' : 'taglie incassate'}` },
  { id: 'undecided', emoji: '🔄', title: 'L’indeciso', min: 1, score: (s) => s.targetSkips, detail: (n) => `${n} cambi di bersaglio` },
  { id: 'architect', emoji: '🏗️', title: 'L’architetto', min: 1, score: (s) => s.finaleTaps, detail: (n) => `torre da ${n} tocchi` },
]
