#!/usr/bin/env node
import { createInterface } from "node:readline/promises";
import { runCli } from "./cli.js";

const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY);

const code = await runCli(process.argv.slice(2), {
  cwd: process.cwd(),
  now: () => new Date(),
  out: (text) => process.stdout.write(`${text}\n`),
  err: (text) => process.stderr.write(`${text}\n`),
  interactive,
  ask: async (question) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try {
      return await rl.question(question);
    } finally {
      rl.close();
    }
  },
});
process.exitCode = code;
