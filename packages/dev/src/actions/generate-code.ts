import { DreamkitDevServer } from "../DreamkitDevServer.js";
import {
  getImportLocations,
  getExports,
  parseCallsChain,
  parseFile,
} from "../utils/ast.js";
import { writeFileIfDifferent } from "../utils/fs.js";
import { replaceText } from "../utils/string.js";
import { extractPathParams } from "@dreamkit/app/utils/routing.js";
import { readFile } from "fs/promises";

export async function generateCode(
  server: DreamkitDevServer,
  input?: { filePath: string; read?: () => string | Promise<string> },
) {
  const result: Record<string, { path: string; changed: boolean }> = {};
  for (const route of server.app.routes) {
    const filePath = route.$options.filePath;
    if (input && filePath !== input.filePath) continue;
    if (!filePath || !route.$options.path) continue;
    const pathParams = extractPathParams(route.$options.path).map(
      (param) => param.name,
    );
    if (!pathParams.length) continue;
    const code = input?.read
      ? await input.read()
      : (await readFile(filePath)).toString();
    let action: ReturnType<typeof getTransformAction> | undefined;
    try {
      action = getTransformAction(code);
    } catch (_) {
      continue;
    }
    let next: string | undefined;
    if (action) {
      const newParamNames = pathParams.map((name) => JSON.stringify(name));
      if (action.type === "replace") {
        if (!checkChanges(code, action.start, action.end, pathParams))
          next = replaceText(
            code,
            action.start,
            action.end,
            `(${newParamNames.join(", ")})`,
          );
      } else if (action.type === "add") {
        next = replaceText(
          code,
          action.start,
          action.start,
          `.pathParams(${newParamNames})`,
        );
      }
    }
    if (next && (await writeFileIfDifferent(filePath, next, code))) {
      result[filePath] = { path: filePath, changed: true };
    }
  }
  return result;
}

function checkChanges(
  code: string,
  start: number,
  end: number,
  newPathParams: string[],
) {
  const currentArgs = code.slice(start, end);
  const json = `[${currentArgs.slice(1, -1)}]`;
  let currentParamNames: string[] = [];
  try {
    currentParamNames = JSON.parse(json).sort();
  } catch (_) {}
  return (
    currentParamNames.sort().join(",") === [...newPathParams].sort().join(",")
  );
}

function getTransformAction(code: string) {
  const ast = parseFile(code);
  const ref = getImportLocations(ast, "dreamkit", ["$route"]);
  for (const item of getExports(ast)) {
    if (item.dec.type === "CallExpression") {
      const chain = parseCallsChain(item.dec);
      if (ref.$route.includes(chain.root.loc!)) {
        const pathParams = chain.calls.find(
          (call) => call.name === "pathParams",
        );
        if (!pathParams) {
          return {
            type: "add" as const,
            start: chain.root.end!,
          };
        } else {
          return {
            type: "replace" as const,
            start: pathParams.property.end!,
            end: pathParams.node.end!,
          };
        }
      }
    }
  }
}
