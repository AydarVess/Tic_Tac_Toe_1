<template>
  <div class="game">
    <h1 class="game__title">Крестики‑нолики</h1>

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

    <button @click="reset" class="game__button-reset">Сброс</button>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const board = ref(Array(9).fill(""));
const xIsNext = ref(true);

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

const winner = computed(() =>
  winningLine.value.length ? board.value[winningLine.value[0]] : null
);

const status = computed(() =>
  winner.value
    ? `Победитель: ${winner.value}`
    : board.value.every((cell) => cell)
    ? "Ничья!"
    : `Ход: ${xIsNext.value ? "X" : "O"}`
);

function makeMove(index) {
  if (board.value[index] || winner.value) return;
  board.value[index] = xIsNext.value ? "X" : "O";
  xIsNext.value = !xIsNext.value;
}

function reset() {
  board.value = Array(9).fill("");
  xIsNext.value = true;
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
  font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
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

.game__board-cell_win, .game__board-cell_win:hover {
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

.game__button-reset {
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

.game__button-reset:hover {
  background: #0052d6;
}

.game__button-reset:active {
  transform: translateY(1px);
}
</style>
