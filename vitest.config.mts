import { configDefaults, defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    // Background-task worktrees under .claude/ hold their own copy of the repo;
    // their tests resolve "@" to this checkout's src, so mocks miss and they fail.
    exclude: [...configDefaults.exclude, ".claude/**"],
  },
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
});
