// `npm run dev:mock`: runs the site and chat locally against scripts/mock-anthropic.mjs,
// so the chat can be tried without an API key and without spending anything.
import { spawn } from "node:child_process";

const MOCK_PORT = process.env.MOCK_PORT || "8790";
const env = { ...process.env, NO_PROXY: [process.env.NO_PROXY, "127.0.0.1", "localhost"].filter(Boolean).join(",") };

const children = [
  spawn(process.execPath, ["scripts/mock-anthropic.mjs", MOCK_PORT], { stdio: "inherit", env }),
  spawn(
    "npx",
    [
      "wrangler",
      "dev",
      "--var",
      "ANTHROPIC_API_KEY:mock-key",
      "--var",
      `ANTHROPIC_BASE_URL:http://127.0.0.1:${MOCK_PORT}`,
      ...process.argv.slice(2),
    ],
    { stdio: "inherit", env },
  ),
];

const stop = () => {
  for (const child of children) child.kill("SIGTERM");
  process.exit();
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
for (const child of children) child.on("exit", stop);
