import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const bun = process.platform === "win32" ? "bun.exe" : "bun";
const services = [
  { name: "Convex", args: ["run", "convex:dev"], cwd: root },
  { name: "Frontend", args: ["run", "--cwd", "frontend", "dev"], cwd: root },
  {
    name: "Landing",
    args: ["run", "--cwd", "landing", "dev"],
    cwd: root,
    env: {
      PUBLIC_APP_URL: "http://localhost:3000",
      PUBLIC_WHATSAPP_NUMBER: "6281234567890",
    },
  },
];

let stopping = false;
const children = [];

function stop(exitCode = 0, signal = "SIGTERM") {
  if (stopping) return;
  stopping = true;
  process.exitCode = exitCode;
  for (const child of children) {
    if (!child.killed) child.kill(signal);
  }
}

process.on("SIGINT", () => stop(0, "SIGINT"));
process.on("SIGTERM", () => stop(0, "SIGTERM"));

console.log("Starting Convex, frontend, and landing site. Press Ctrl+C to stop all three.");
console.log("Frontend: http://localhost:3000  |  Landing: http://localhost:4321");

for (const service of services) {
  const child = spawn(bun, service.args, {
    cwd: service.cwd,
    env: { ...process.env, ...service.env },
    stdio: "inherit",
    shell: false,
  });
  children.push(child);
  child.on("error", (error) => {
    console.error(`${service.name} failed to start:`, error.message);
    stop(1);
  });
  child.on("exit", (code) => {
    if (!stopping) {
      console.error(`${service.name} exited${code === 0 ? "" : ` with code ${code ?? 1}`}; stopping the other services.`);
      stop(code ?? 1);
    }
  });
}
