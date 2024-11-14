import { exportDefault } from "../transforms/export-default.js";
import { noExport } from "../transforms/no-export.js";
import { pickExport } from "../transforms/pick-export.js";
import { replaceImportSpec } from "../transforms/replace-import-spec.js";
import { toSolidLink } from "../transforms/to-solid-link.js";
import { toSolidRoute } from "../transforms/to-solid-route.js";
import { toSolidServerAction } from "../transforms/to-solid-server-action.js";
import { tryGenerate, parseFile, ParseFileResult } from "./ast.js";

const $transforms = {
  pickExport,
  exportDefault,
  noExport,
  replaceImportSpec,
  toSolidRoute,
  toSolidLink,
  toSolidServerAction,
};

export type TransformObject = {
  [K in keyof typeof $transforms]?: TrueIfUndefined<
    Parameters<
      (typeof $transforms)[K] extends Transform<any>
        ? (typeof $transforms)[K]["run"]
        : (typeof $transforms)[K] extends TransformRun<any>
          ? (typeof $transforms)[K]
          : never
    >[1]
  >;
};

export type TransformRun<T = any> = (
  ast: ParseFileResult,
  options: T,
) => number;

export type Transform<T = any> = {
  onlyIf?: (code: string, options: T) => boolean;
  run: TransformRun<T>;
};

export function transformCode(code: string, ...input: TransformObject[]) {
  let ast: ParseFileResult | undefined;
  let changes = 0;
  for (const item of input) {
    for (let [name, options] of Object.entries(item)) {
      if (name in $transforms) {
        const $transform = ($transforms as any)[name] as
          | Transform
          | TransformRun;
        let run: TransformRun;
        if ("run" in $transform) {
          if (ast === undefined && $transform.onlyIf)
            if (!$transform.onlyIf(code, options)) continue;
          run = $transform.run;
        } else {
          run = $transform;
        }
        ast = ast || parseFile(code);
        changes += run(ast, options) || 0;
      }
    }
  }
  return changes ? ast : undefined;
}

export function transformAndGenerate(
  code: string,
  ...input: TransformObject[]
) {
  const ast = transformCode(code, ...input);
  return tryGenerate(ast) || { code: undefined, map: undefined };
}

export function transformCodeByUrl(id: string, code: string) {
  const transforms = getUrlTransforms(id);
  return transformCode(code, ...transforms);
}

type TrueIfUndefined<T> = [undefined] extends [T] ? true : T;

export function createTransformUrl(
  id: string,
  ...transforms: TransformObject[]
) {
  const url = new URL(id, "file://");
  const prev = getUrlTransforms(id);
  prev.push(...transforms);
  if (prev.length) url.searchParams.set("dkt", JSON.stringify(prev));
  const search = prev.length ? `${url.search}&` : url.search;
  return id.split("?")[0] + search;
}

export function getUrlTransforms(id: string): TransformObject[] {
  const url = new URL(id, "file://");
  const params = [...url.searchParams.entries()];
  const dkTransforms = url.searchParams.get("dkt") || "[]";
  return JSON.parse(dkTransforms) as TransformObject[];
}
