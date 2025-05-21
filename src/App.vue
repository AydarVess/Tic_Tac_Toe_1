<template>
  <div class="game">
    <h1 class="game__title">Крестики-нолики</h1>

    <div class="game__board">
      <div
        v-for="(cell, index) in board"
        :key="index"
        class="game__board-cell"
        @click="makeMove(index)"
      >
        {{ cell }}
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

const winner = computed(() => {
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
  for (const [a, b, c] of lines) {
    if (
      board.value[a] &&
      board.value[a] === board.value[b] &&
      board.value[a] === board.value[c]
    ) {
      return board.value[a];
    }
  }
  return null;
});

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
body {
  font-family: sans-serif;
  text-align: center;
}
.game__board {
  display: grid;
  align-content: center;
  justify-content: center;
  grid-template-columns: repeat(3, 100px);
  margin: 20px auto;
}
.game__board-cell {
  width: 100px;
  height: 100px;
  border: 1px solid #aaa;
  font-size: 2em;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}
.game__status {
  margin-top: 10px;
}
</style>