import { challengeText } from '../content/challenges.js'

const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]

function winningLine(board) {
  return LINES.find(([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c]) || null
}

function TrisView({ ch, meId, send }) {
  const { board, turn, marks, line } = ch.data
  const active = ch.state === 'active'
  const myTurn = active && turn === meId
  return (
    <div className="tris">
      <p className="status-line">
        {active ? (myTurn ? `Tocca a te! Sei ${marks[meId] === 'X' ? '✖️' : '⭕'}` : 'Tocca all’avversario…') : ' '}
      </p>
      <div className="tris-grid">
        {board.map((cell, i) => (
          <button
            key={i}
            className={`tris-cell ${line?.includes(i) ? 'win' : ''} ${cell ? 'filled' : ''}`}
            disabled={!myTurn || !!cell}
            onClick={() => send({ cell: i })}
          >
            {cell === 'X' ? '✖️' : cell === 'O' ? '⭕' : ''}
          </button>
        ))}
      </div>
    </div>
  )
}

export default {
  id: 'tris',
  kind: 'digital_1v1',
  ...challengeText.tris,
  drinkOnLose: false,

  init({ players, rng }) {
    const [first, second] = rng() < 0.5 ? players : [players[1], players[0]]
    return { board: Array(9).fill(''), turn: first, marks: { [first]: 'X', [second]: 'O' } }
  },

  move(data, { playerId, move }) {
    const i = move?.cell
    if (data.turn !== playerId || !(i >= 0 && i < 9) || data.board[i]) return null
    const board = [...data.board]
    board[i] = data.marks[playerId]
    const other = Object.keys(data.marks).find((id) => id !== playerId)
    const next = { ...data, board, turn: other }
    const line = winningLine(board)
    if (line) return { data: { ...next, line }, result: { winnerId: playerId } }
    if (board.every(Boolean)) return { data: next, result: { draw: true } }
    return { data: next }
  },

  // tempo scaduto: partita a metà = pareggio
  forceResult: () => ({ draw: true }),

  bot(data, { botId, rng }) {
    if (data.turn !== botId) return null
    const free = data.board.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0)
    return free.length ? { cell: free[Math.floor(rng() * free.length)] } : null
  },

  Component: TrisView,
}
