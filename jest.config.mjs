import nextJest from "next/jest.js";

export default nextJest({ dir: "." })({
  testMatch: ["**/test/jest/**/*.spec.*"],
  collectCoverageFrom: ["src/**/*"],
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["whatwg-fetch", "./test/jest/initialize.ts"],
});
