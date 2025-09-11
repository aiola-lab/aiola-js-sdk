import { defineConfig } from 'tsup'

export default defineConfig([
  // Node.js build (CJS + ESM)
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    platform: 'node',
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    outDir: 'dist',
    outExtension({ format }) {
      return {
        js: format === 'cjs' ? '.js' : '.mjs'
      }
    }
  },
  // Browser build (ESM only)
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    platform: 'browser',
    dts: false,
    splitting: false,
    sourcemap: true,
    outDir: 'dist/browser',
    outExtension() {
      return { js: '.mjs' }
    },
    external: ['form-data'],
    define: {
      'process.env.NODE_ENV': '"production"'
    }
  }
])
