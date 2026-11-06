import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** On-disk video directory (gitignored via api/data/). */
export function videosDir(): string {
  const fromEnv = process.env.VIDEO_STORAGE_DIR?.trim();
  if (fromEnv) {
    return path.resolve(fromEnv);
  }
  return path.resolve(__dirname, "../data/videos");
}

export async function ensureVideosDir(): Promise<string> {
  const dir = videosDir();
  await mkdir(dir, { recursive: true });
  return dir;
}

export function videoFilePath(filename: string): string {
  const base = path.basename(filename);
  if (base !== filename || base.includes("..")) {
    throw new Error("invalid_filename");
  }
  return path.join(videosDir(), base);
}
