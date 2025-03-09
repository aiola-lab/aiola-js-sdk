/** @type {import('jest').Config} */
export default {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
    "^.+\\.jsx?$": [
      "babel-jest",
      {
        presets: ["@babel/preset-env"],
      },
    ],
  },
  extensionsToTreatAsEsm: [".ts"],
  testMatch: ["**/*.test.ts"],
  setupFiles: ["./jest.setup.ts"],
  transformIgnorePatterns: ["node_modules/(?!whatwg-fetch|socket.io-client)/"],
};
