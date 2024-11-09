import { pickExport } from "../transforms/pick-export.js";
import { findExportedNames, parseFile } from "./ast.js";
import { generator } from "./babel.js";
import { getExt } from "./path.js";
import { createTransformUrl } from "./transform.js";
import { cloneNode } from "@babel/types";
import { readFileSync } from "fs";
import { ModuleNode } from "vite";

export type Change = { name: string; action: "create" | "delete" | "update" };

type VirtualShakingOptions = {
  entry: string;
  onChange?: (changes: Change[]) => any;
};

export class VirtualShaking {
  public code: Record<string, string> = {};
  readonly path: string;
  constructor(readonly options: VirtualShakingOptions) {
    this.path = options.entry.replaceAll("\\", "/");
  }
  protected split(code?: string) {
    const virtual: Record<string, string> = {};
    try {
      if (!code) code = readFileSync(this.path).toString();
    } catch (error) {
      if ((error as any).code !== "ENOENT") throw error;
      code = "";
    }
    const ast = parseFile(code);
    const exports = findExportedNames(ast);
    for (const name of exports) {
      const astExport = cloneNode(ast);
      pickExport(astExport, [name]);
      const transform = generator(astExport);
      virtual[name] = transform.code.replace(/\n+/g, "\n");
    }
    return virtual;
  }
  init() {
    this.code = this.split();
  }
  getEntryExportId(name: string) {
    const ext = getExt(this.path);
    return (
      createTransformUrl(this.path, {
        pickExport: [name],
      }) + `&ext=${ext}`
    );
  }
  tryLoad(id: string) {
    const [path] = id.split("?");
    if (path !== this.path) return;
    const pick = new URL(`file://${id}`).searchParams.get("dk-pick");
    if (!pick) return;
    const code = this.code[pick];
    return { code };
  }
  async tryUpdate(
    path: string,
    read: () => string | Promise<string>,
    modules: ModuleNode[],
  ) {
    if (path !== this.path) return modules;
    const prev = this.code || {};
    const next = this.split(await read());
    const newModuleIds: string[] = [];
    const changes: Change[] = [];
    for (const name in next) {
      if (prev[name] !== next[name]) {
        changes.push({
          name,
          action: prev[name] === undefined ? "create" : "update",
        });
        const url = this.getEntryExportId(name);
        newModuleIds.push(url);
      }
    }
    const deleted = Object.keys(prev).filter((name) => !(name in next));
    for (const name of deleted) changes.push({ name, action: "delete" });
    if (changes.length) this.options.onChange?.(changes);
    this.code = next;
    return modules.filter((m) => newModuleIds.includes(m.id ?? ""));
  }
}
