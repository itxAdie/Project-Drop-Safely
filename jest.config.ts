import type { Config } from "jest";
import nextJest from "next/jest";

const createJestConfig = nextJest({
  dir: "./",
});

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testMatch: ["<rootDir>/__tests__/**/*.test.ts", "<rootDir>/__tests__/**/*.test.tsx"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(@testing-library)/)",
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/__tests__/",
    "/.next/",
    "/whatsapp-service/",
  ],
  collectCoverageFrom: [
    "src/lib/services/**/*.ts",
    "src/lib/validators/**/*.ts",
    "!src/**/*.d.ts",
  ],
};

export default createJestConfig(config);
