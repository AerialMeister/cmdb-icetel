import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' -> rutas relativas, funciona en GitHub Pages bajo cualquier subcarpeta
export default defineConfig({
  plugins: [react()],
  base: './',
})
