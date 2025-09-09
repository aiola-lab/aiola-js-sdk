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
    dts: false, // Don't duplicate .d.ts files
    splitting: false,
    sourcemap: true,
    outDir: 'dist/browser',
    outExtension() {
      return { js: '.mjs' }
    },
    external: ['form-data'], // Don't bundle form-data for browser
    define: {
      // Replace Node.js-specific code with browser equivalents
      'process.env.NODE_ENV': '"production"'
    }
  }
])
