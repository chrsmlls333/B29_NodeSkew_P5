import { defineConfig } from 'vite'

const packageJson = require('./package.json')
const deps = Object.keys(packageJson.dependencies)

export default defineConfig({
  build: {
    sourcemap: true,
  }
})