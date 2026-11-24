// Emoji avatar (scelte dal giocatore) e simboli di caccia (assegnati dal gioco). I due insiemi non si sovrappongono.
export const AVATAR_EMOJIS = [
  '😎', '🤠', '🥳', '🤡', '👻', '👽', '🤖', '🎃', '💀', '😈', '🧙', '🧛',
  '🧜', '🧞', '🦸', '🥸', '🤓', '😇', '🤪', '😜', '🫠', '🤯', '🥶', '🤩',
]

// Il nome evita equivoci: le emoji cambiano disegno tra un telefono e l'altro.
export const SYMBOL_NAMES = {
  '🐙': 'Polpo', '🦊': 'Volpe', '🐸': 'Rana', '🐼': 'Panda',
  '🦄': 'Unicorno', '🐝': 'Ape', '🦖': 'T-Rex', '🐧': 'Pinguino',
  '🦉': 'Gufo', '🐢': 'Tartaruga', '🦀': 'Granchio', '🐳': 'Balena',
  '🦒': 'Giraffa', '🐌': 'Lumaca', '🦜': 'Pappagallo', '🐞': 'Coccinella',
  '🦔': 'Riccio', '🦩': 'Fenicottero', '🐊': 'Coccodrillo', '🦥': 'Bradipo',
  '🍕': 'Pizza', '🍩': 'Ciambella', '🌵': 'Cactus', '🍄': 'Fungo',
  '🎸': 'Chitarra', '🚀': 'Razzo', '⚓': 'Ancora', '🎲': 'Dado',
  '🧲': 'Calamita', '🔑': 'Chiave', '🎺': 'Tromba', '🪐': 'Saturno',
  '🌈': 'Arcobaleno', '🍉': 'Anguria', '🥑': 'Avocado', '🧀': 'Formaggio',
  '🎯': 'Freccette', '🧸': 'Orsetto', '⛄': 'Pupazzo di neve', '🌻': 'Girasole',
  '🍔': 'Hamburger', '🥨': 'Pretzel', '🛸': 'Ufo', '🪁': 'Aquilone',
}

export const HUNT_SYMBOLS = Object.keys(SYMBOL_NAMES)
export const symbolLabel = (symbol) => [symbol, SYMBOL_NAMES[symbol]].filter(Boolean).join(' ')

// Nomi dei giocatori finti (solo debug)
export const BOT_NAMES = [
  'Zio Tonino', 'Nonna Pina', 'Gigi', 'Mariello', 'Pippo', 'Ugo', 'Ornella', 'Santino',
  'Rosetta', 'Brunello', 'Carmela', 'Tito', 'Lalla', 'Fefè', 'Gino', 'Cesira',
  'Nando', 'Wanda', 'Osvaldo', 'Ettore',
]
