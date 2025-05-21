import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const repo = 'Tic_Tac_Toe_1'
export default defineConfig({
  base: process.env.GITHUB_ACTIONS
    ? `/${repo}/`
    : '/',
  plugins: [vue()],
})
