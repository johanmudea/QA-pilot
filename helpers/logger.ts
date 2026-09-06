import * as fs from "fs";
import * as path from "path";

const logDir = path.join(__dirname, "..", "logs");
const logFile = path.join(logDir, "execution.log");

type Level = "info" | "warn" | "error" | "debug";

function write(level: Level, message: string): void {
  const line = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`;
  // eslint-disable-next-line no-console
  console.log(line);
  fs.mkdirSync(logDir, { recursive: true });
  fs.appendFileSync(logFile, line + "\n");
}

export const logger = {
  info: (message: string) => write("info", message),
  warn: (message: string) => write("warn", message),
  error: (message: string) => write("error", message),
  debug: (message: string) => write("debug", message),
};
