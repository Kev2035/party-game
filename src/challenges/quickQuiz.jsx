import { generalQuestions } from '../content/quickQuiz.js'
import { PERSONAL_QUESTION_CHANCE, honoree, personalQuestions } from '../custom/index.js'
import { shuffle } from '../utils/text.js'
import { makeChoice, makeRound } from './choice.jsx'

const ROUNDS = 3

const toRound = (q, rng, sub) =>
  makeRound({ prompt: q.q, sub, right: q.options[q.answer], wrong: q.options.filter((_, i) => i !== q.answer) }, rng)

export default makeChoice({
  id: 'quickQuiz',
  drinkOnLose: true,
  setup(rng) {
    const personal = honoree ? personalQuestions : []
    const withPersonal = personal.length > 0 && rng() < PERSONAL_QUESTION_CHANCE
    const general = shuffle(generalQuestions, rng).slice(0, withPersonal ? ROUNDS - 1 : ROUNDS)
    const rounds = general.map((q) => toRound(q, rng))
    if (withPersonal) rounds.push(toRound(shuffle(personal, rng)[0], rng, `🎂 Quanto conosci ${honoree}?`))
    return { rounds }
  },
})
