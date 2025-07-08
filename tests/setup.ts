import { afterAll, beforeAll } from "@jest/globals";

jest.mock('nanoid', () => {
  return {
    nanoid: () => Math.random().toString(),
  };
});

beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "debug").mockImplementation(() => {});
});

afterAll(() => {
  jest.clearAllMocks();
});