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
  // Node.js build MINIFIED (CJS + ESM)
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    platform: 'node',
    dts: false,
    splitting: false,
    sourcemap: true,
    minify: true,
    outDir: 'dist',
    outExtension({ format }) {
      return {
        js: format === 'cjs' ? '.min.js' : '.min.mjs'
      }
    }
  },
  // Browser build (CJS + ESM)
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    platform: 'browser',
    dts: false,
    splitting: false,
    sourcemap: true,
    outDir: 'dist/browser',
    outExtension({ format }) {
      return {
        js: format === 'cjs' ? '.js' : '.mjs'
      }
    },
    external: ['form-data'],
    define: {
      'process.env.NODE_ENV': '"production"'
    }
  },
  // Browser build MINIFIED (CJS + ESM)
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    platform: 'browser',
    dts: false,
    splitting: false,
    sourcemap: true,
    minify: true,
    outDir: 'dist/browser',
    outExtension({ format }) {
      return {
        js: format === 'cjs' ? '.min.js' : '.min.mjs'
      }
    },
    external: ['form-data'],
    define: {
      'process.env.NODE_ENV': '"production"'
    }
  }
])
