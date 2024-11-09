import { readFile, writeFile } from "fs/promises";

export async function writeFileIfDifferent(
  path: string,
  content: string,
  prev?: string,
) {
  if (!prev) prev = await tryReadFile(path);
  const write = prev !== content;
  if (write) await writeFile(path, content);
  return write;
}

export async function tryReadFile(path: string) {
  try {
    return (await readFile(path)).toString();
  } catch (_) {
    return;
  }
}

export async function tryReadTextFile(path: string) {
  return (await tryReadFile(path))?.toString();
}

export async function tryReadJsonFile<T>(path: string): Promise<T | undefined> {
  const json = (await tryReadFile(path))?.toString();
  return typeof json === "string" ? JSON.parse(json) : undefined;
}
