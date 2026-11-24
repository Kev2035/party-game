import { emojiRebus } from '../content/emojiRebus.js'
import { shuffle } from '../utils/text.js'
import { makeChoice, makeRound } from './choice.jsx'

const ROUNDS = 3

export default makeChoice({
  id: 'emojiRebus',
  setup(rng) {
    const rounds = shuffle(emojiRebus, rng)
      .slice(0, ROUNDS)
      .map((r) => makeRound({ prompt: r.emoji, sub: r.kind === 'film' ? '🎬 Che film è?' : '🎵 Che canzone è?', big: true, right: r.answer, wrong: r.wrong }, rng))
    return { rounds }
  },
})
