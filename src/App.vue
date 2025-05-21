<template>
  <div class="game">
    <h1 class="game__title">Крестики‑нолики</h1>

    <div class="game__modes">
      <button
        @click="switchMode('multiplayer')"
        class="game__button"
        :disabled="gameMode === 'multiplayer'"
        :style="{ opacity: gameMode === 'multiplayer' ? 0.55 : 1 }"
      >
        2 игрока
      </button>
      <button
        @click="switchMode('bot')"
        class="game__button"
        :disabled="gameMode === 'bot'"
        :style="{ opacity: gameMode === 'bot' ? 0.55 : 1 }"
      >
        VS бот
      </button>
    </div>

    <div class="game__mode-label">Режим: {{ currentModeLabel }}</div>

    <div class="game__board">
      <div
        v-for="(cell, index) in board"
        :key="index"
        class="game__board-cell"
        :class="{
          'game__board-cell_x': cell === 'X',
          'game__board-cell_o': cell === 'O',
          'game__board-cell_win': winningLine.includes(index),
        }"
        @click="makeMove(index)"
      >
        <span class="game__symbol" v-if="cell">{{ cell }}</span>
      </div>
    </div>

    <div class="game__status">{{ status }}</div>

    <button @click="reset" class="game__button">Сброс игру</button>

    <div class="game__stats">
      X - Побед: {{ stats.X }} | O - Побед: {{ stats.O }} | Ничья:
      {{ stats.draws }}
    </div>

    <button @click="share" class="game__button">Поделиться</button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";

const tg = window.Telegram?.WebApp;
tg && tg.ready();

const board = ref(Array(9).fill(""));
const xIsNext = ref(true);
const gameMode = ref("multiplayer");
const botSymbol = ref("O");

function switchMode(mode) {
  if (mode === gameMode.value) return;
  gameMode.value = mode;
  reset();
}

const currentModeLabel = computed(() =>
  gameMode.value === "multiplayer" ? "2 игрока" : "VS бот"
);

const lines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const winningLine = computed(() => {
  for (const [a, b, c] of lines) {
    if (
      board.value[a] &&
      board.value[a] === board.value[b] &&
      board.value[a] === board.value[c]
    ) {
      return [a, b, c];
    }
  }
  return [];
});

const winner = computed(() => {
  if (winningLine.value.length) return board.value[winningLine.value[0]];
  return !board.value.every((cell) => cell) ? null : "draws";
});

const status = computed(() => {
  if (winner.value && winner.value !== "draws")
    return `Победитель: ${winner.value}`;
  if (board.value.every((cell) => cell)) return "Ничья!";
  return gameMode.value === "bot" && currentTurnIsBot()
    ? "Ходит бот…"
    : `Ход: ${xIsNext.value ? "X" : "O"}`;
});

function makeMove(index) {
  if (
    board.value[index] ||
    winner.value ||
    (gameMode.value === "bot" && currentTurnIsBot())
  )
    return;
  placeSymbol(index, xIsNext.value ? "X" : "O");
  maybeBotMove();
}

function placeSymbol(index, symbol) {
  board.value[index] = symbol;
  xIsNext.value = !xIsNext.value;
}

function currentTurnIsBot() {
  const currentSymbol = xIsNext.value ? "X" : "O";
  return gameMode.value === "bot" && botSymbol.value === currentSymbol;
}

function maybeBotMove() {
  if (!currentTurnIsBot() || winner.value) return;
  setTimeout(() => {
    const empty = board.value
      .map((v, i) => (v === "" ? i : null))
      .filter((v) => v !== null);
    if (!empty.length) return;
    const randomIndex = empty[Math.floor(Math.random() * empty.length)];
    placeSymbol(randomIndex, botSymbol.value);
  }, 300);
}

function reset() {
  board.value = Array(9).fill("");

  if (gameMode.value === "bot") {
    const botFirst = Math.random() < 0.5;
    botSymbol.value = botFirst ? "X" : "O";
    xIsNext.value = true;

    if (botFirst) {
      maybeBotMove();
    }
  } else {
    xIsNext.value = true;
  }
}

onMounted(() => {
  applyTheme();
  tg?.expand();
});
tg?.onEvent("themeChanged", applyTheme);

function applyTheme() {
  const dark = tg?.colorScheme === "dark";
  document.body.style.background = dark
    ? "#1d1e22"
    : "radial-gradient(circle at top, #f0f4ff 0%, #d9e8ff 100%)";
}

const stats = ref({ X: 0, O: 0, draws: 0 });
onMounted(() => {
  tg?.deviceStorage?.getItem("ttt_stats", (err, val) => {
    if (!err && val) stats.value = JSON.parse(val);
  });
});

watch(
  () => winner.value,
  (w) => {
    if (!w) return;

    stats.value[w]++;
    tg?.deviceStorage?.setItem("ttt_stats", JSON.stringify(stats.value));
  }
);

function impact(type = "medium") {
  tg?.hapticFeedback?.impactOccurred(type);
}

watch(board, () => impact("light"));
watch(winner, (w) => w && tg?.hapticFeedback?.notificationOccurred("success"));

watch(winner, (w) => {
  if (!w || w === 'draws') {
    tg?.MainButton.hide();
    return;
  }
  tg.MainButton.setText(`🎉 ${w} победил – поделиться`)
    .show()
    .onClick(() => {
      const payload = {
        winner: w,
        mode: gameMode.value,
        stats: stats.value,
        ts: Date.now(),
      };
      tg.sendData(JSON.stringify(payload));
      tg.MainButton.offClick();
    });
});

function share() {
  tg.shareMessage({
    message: `Я только что выиграл в Tik-Tak-Toe! Попробуй и ты 😉`,
    url: location.href,
  });
}
</script>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
  background: radial-gradient(circle at top, #f0f4ff 0%, #d9e8ff 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.game {
  padding: 2rem;
  background: #ffffff;
  border-radius: 1.5rem;
  box-shadow: 0 15px 25px rgba(0, 0, 0, 0.1);
}

.game__title {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #333;
  letter-spacing: 0.5px;
  text-align: center;
}

.game__modes {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.game__mode-label {
  text-align: center;
  margin-bottom: 0.25rem;
  color: #555;
  font-size: 0.9rem;
}

.game__board {
  display: grid;
  grid-template-columns: repeat(3, 100px);
  gap: 6px;
  margin: 0 auto 1rem;
}

.game__board-cell {
  width: 100px;
  height: 100px;
  background: #fafafa;
  border: 2px solid #d0d7ff;
  border-radius: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.3s ease, border-color 0.3s ease;
  user-select: none;
}

.game__board-cell:hover {
  transform: translateY(-4px);
  background: #f5f8ff;
  border-color: #b3c4ff;
}

.game__symbol {
  font-size: 3rem;
  font-weight: 700;
  opacity: 0;
  animation: fade-in 0.25s forwards ease-out;
}

@keyframes fade-in {
  to {
    opacity: 1;
  }
}

.game__board-cell_x .game__symbol {
  color: #0066ff;
}

.game__board-cell_o .game__symbol {
  color: #ff3366;
}

.game__board-cell_win,
.game__board-cell_win:hover {
  background: #ffe869;
  border-color: #ffda47;
  animation: pulse 0.8s infinite alternate;
}

@keyframes pulse {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.05);
  }
}

.game__status {
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  color: #555;
}

.game__button {
  appearance: none;
  outline: none;
  border: none;
  cursor: pointer;
  padding: 0.6rem 1.5rem;
  border-radius: 9999px;
  background: #0066ff;
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  transition: background 0.2s ease, transform 0.15s ease;
}

.game__button:hover {
  background: #0052d6;
}

.game__button:active {
  transform: translateY(1px);
}

.game__stats {
  font-size: 1.1rem;
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
  color: #555;
}
</style>
