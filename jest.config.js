/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/libs/**/*.test.ts"],
  moduleNameMapper: {
    "^@aiola-js-sdk/(.*)$": "<rootDir>/libs/$1/src",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
};
