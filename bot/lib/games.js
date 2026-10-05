import crypto from 'node:crypto';

const games = new Map();
const trivia = [
  { question: '¿Cuál es el planeta rojo?', answer: 'marte' },
  { question: '¿Cuántos bits hay en un byte?', answer: '8' },
  { question: '¿Cuál es la capital de Japón?', answer: 'tokio' }
];
const now = () => Date.now();

export function createGuess(chat, sender, type = 'guess') {
  const answer = crypto.randomInt(1, 21);
  games.set(`${chat}:${type}`, { sender, answer: String(answer), expires: now() + 120_000 });
  return answer;
}
export function createAnswerGame(chat, sender, answer, type) {
  games.set(`${chat}:${type}`, { sender, answer: String(answer), expires: now() + 120_000 });
}
export function answerGuess(chat, sender, answer, type = 'guess') {
  const key = `${chat}:${type}`;
  const game = games.get(key);
  if (!game || game.expires < now()) { games.delete(key); return { state: 'missing' }; }
  if (game.sender !== sender) return { state: 'not-owner' };
  if (String(answer).trim().toLowerCase() === String(game.answer).toLowerCase()) { games.delete(key); return { state: 'won', answer: game.answer }; }
  return { state: 'wrong' };
}
export function randomTrivia(chat, sender) {
  const selected = trivia[crypto.randomInt(0, trivia.length - 1)];
  games.set(`${chat}:trivia`, { sender, answer: selected.answer, expires: now() + 120_000 });
  return selected.question;
}
export function startTictactoe(chat, playerX, playerO) {
  const key = `${chat}:tictactoe`;
  if (games.has(key)) return { state: 'exists' };
  games.set(key, { playerX, playerO, board: Array(9).fill(null), turn: playerX, expires: now() + 15 * 60_000 });
  return { state: 'started' };
}
export function playTictactoe(chat, player, cell) {
  const key = `${chat}:tictactoe`;
  const game = games.get(key);
  if (!game || game.expires < now()) { games.delete(key); return { state: 'missing' }; }
  if (game.turn !== player) return { state: 'not-turn', board: game.board, turn: game.turn };
  const index = Number(cell) - 1;
  if (!Number.isInteger(index) || index < 0 || index > 8 || game.board[index]) return { state: 'invalid', board: game.board };
  const mark = player === game.playerX ? 'X' : 'O';
  game.board[index] = mark;
  const winners = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  if (winners.some((line) => line.every((position) => game.board[position] === mark))) { games.delete(key); return { state: 'won', board: game.board, winner: player, mark }; }
  if (game.board.every(Boolean)) { games.delete(key); return { state: 'draw', board: game.board }; }
  game.turn = player === game.playerX ? game.playerO : game.playerX;
  return { state: 'played', board: game.board, turn: game.turn };
}
export function gameCount() { return games.size; }
