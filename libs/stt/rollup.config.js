import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/index.ts",
  output: {
    file: "dist/bundle/index.js",
    format: "es",
    sourcemap: true,
    name: "AiolaSTT",
  },
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false,
    }),
    commonjs(),
    typescript({
      tsconfig: "./tsconfig.esm.json",
      sourceMap: true,
      outDir: "dist/bundle",
    }),
  ],
  external: [], // Bundle all dependencies
  onwarn(warning, warn) {
    // Only show warnings and errors
    if (warning.code === "CIRCULAR_DEPENDENCY") {
      return;
    }
    warn(warning);
  },
};
