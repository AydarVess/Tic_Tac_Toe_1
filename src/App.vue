<template>
  <div class="game">
    <h1 class="game__title">Крестики-нолики</h1>
    <h1 class="game__sub-title">Давай сыграем, {{ firstName }}!</h1>

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

    <button @click="reset" class="game__button">Сбросить игру</button>

    <div class="game__stats">
      X — побед: {{ stats.X }} | O — побед: {{ stats.O }} | Ничья:
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
  return board.value.every(Boolean) ? "draws" : null;
});

const status = computed(() => {
  if (winner.value && winner.value !== "draws")
    return `Победитель: ${winner.value}`;

  if (board.value.every(Boolean)) return "Ничья!";

  return gameMode.value === "bot" && currentTurnIsBot()
    ? "Ходит бот…"
    : `Ход: ${xIsNext.value ? "X" : "O"}`;
});

function makeMove(index) {
  if (
    board.value[index] ||
    winner.value ||
    (gameMode.value === "bot" && currentTurnIsBot())
  ) {
    return;
  }

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

    if (botFirst) maybeBotMove();
  } else {
    xIsNext.value = true;
  }
}

onMounted(() => {
  tg?.expand();
  injectThemeVars();
});

tg?.onEvent("themeChanged", injectThemeVars);

function injectThemeVars() {
  if (!tg?.themeParams) return;

  const root = document.documentElement;
  const {
    bg_color,
    secondary_bg_color,
    link_color,
    destructive_text_color,
    button_color,
    button_text_color,
  } = tg.themeParams;

  root.style.setProperty("--app-bg", bg_color ?? "#f0f4ff");
  root.style.setProperty("--app-secondary-bg", secondary_bg_color ?? "#ffffff");
  root.style.setProperty("--app-link", link_color ?? "#0066ff");
  root.style.setProperty(
    "--app-destructive",
    destructive_text_color ?? "#ff3366"
  );
  root.style.setProperty("--app-button", button_color ?? "#0066ff");
  root.style.setProperty("--app-button-text", button_text_color ?? "#ffffff");
}

const stats = ref({ X: 0, O: 0, draws: 0 });

onMounted(() => {
  tg?.deviceStorage?.getItem("ttt_stats", (err, val) => {
    if (!err && val) stats.value = JSON.parse(val);
  });
});

const firstName = ref('')

onMounted(() => {
  firstName.value = tg?.initDataUnsafe?.user?.first_name || 'друг'
})

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
  if (!w || w === "draws") {
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
  const text = encodeURIComponent(
    "Я только что выиграл в Крестики-Нолики! Попробуй и ты 😉"
  );
  const url = "https://aydarvess.github.io/Tic_Tac_Toe_1";
  tg.openTelegramLink(`https://t.me/share/url?url=${url}&text=${text}`);
}
</script>

<style>
:root {
  --app-bg: var(--tg-theme-bg-color, #f0f4ff);
  --app-secondary-bg: var(--tg-theme-secondary-bg-color, #ffffff);

  --app-text: var(--tg-theme-text-color, #333333);
  --app-hint: var(--tg-theme-hint-color, #555555);

  --app-link: var(--tg-theme-link-color, #0066ff);
  --app-button: var(--tg-theme-button-color, #0066ff);
  --app-button-winner: #ffe869;
  --app-button-text: var(--tg-theme-button-text-color, #ffffff);

  --app-destructive: var(--tg-theme-destructive-text-color, #ff3366);
  --app-section-separator: var(--tg-theme-section-separator-color, #d0d7ff);
}

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
  background: var(--app-bg);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--app-text);
}

.game {
  padding: 2rem;
  background: var(--app-secondary-bg);
  border-radius: 1.5rem;
  box-shadow: 0 15px 25px rgba(0 0 0 / 0.1);
}

.game__title {
  font-size: 2rem;
  margin-bottom: 1rem;
  text-align: center;
}

.game__sub-title {
  font-size: 1rem;
  margin-bottom: 1rem;
  text-align: center;
}

.game__modes {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.game__mode-label,
.game__status,
.game__stats {
  text-align: center;
  color: var(--app-hint);
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
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
  background: var(--app-secondary-bg);
  border: 2px solid var(--app-section-separator);
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
  background: color-mix(in srgb, var(--app-secondary-bg) 90%, #000 10%);
  border-color: color-mix(in srgb, var(--app-section-separator) 80%, #000 20%);
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
  color: var(--app-link);
}

.game__board-cell_o .game__symbol {
  color: var(--app-destructive);
}

.game__board-cell_win,
.game__board-cell_win:hover {
  background: var(--app-button-winner);
  border-color: var(--app-button);
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

.game__button {
  appearance: none;
  outline: none;
  border: none;
  cursor: pointer;
  padding: 0.6rem 1.5rem;
  border-radius: 9999px;
  background: var(--app-button);
  color: var(--app-button-text);
  font-size: 1rem;
  font-weight: 600;
  transition: background 0.2s ease, transform 0.15s ease;
}

.game__button:hover {
  background: color-mix(in srgb, var(--app-button) 85%, #000 15%);
}

.game__button:active {
  transform: translateY(1px);
}
</style>
