import { exportDefault } from "../transforms/export-default.js";
import { noExport } from "../transforms/no-export.js";
import { pickExport } from "../transforms/pick-export.js";
import { replaceImportSpec } from "../transforms/replace-import-spec.js";
import { toSolidRoute } from "../transforms/to-solid-route.js";
import { parseFile, ParseFileResult } from "./ast.js";

const $transforms = {
  pickExport,
  exportDefault,
  noExport,
  toSolidRoute,
  replaceImportSpec,
};

export type Transform = {
  [K in keyof typeof $transforms]?: TrueIfUndefined<
    Parameters<(typeof $transforms)[K]>[1]
  >;
};

export function transformCode(code: string, ...input: Transform[]) {
  let ast: ParseFileResult | undefined;
  for (const item of input) {
    for (let [name, value] of Object.entries(item)) {
      if (name in $transforms) {
        ast = ast || parseFile(code);
        ($transforms as any)[name](ast, value);
      }
    }
  }
  return ast;
}

export function transformCodeByUrl(id: string, code: string) {
  const transforms = getUrlTransforms(id);
  return transformCode(code, ...transforms);
}

type TrueIfUndefined<T> = [undefined] extends [T] ? true : T;

export function createTransformUrl(
  id: string,
  ...transforms: {
    [K in keyof typeof $transforms]?: TrueIfUndefined<
      Parameters<(typeof $transforms)[K]>[1]
    >;
  }[]
) {
  const url = new URL(id, "file://");
  const prev = getUrlTransforms(id);
  prev.push(...transforms);
  if (prev.length) url.searchParams.set("dkt", JSON.stringify(prev));
  const search = prev.length ? `${url.search}&` : url.search;
  return id.split("?")[0] + search;
}

export function getUrlTransforms(id: string): Transform[] {
  const url = new URL(id, "file://");
  const params = [...url.searchParams.entries()];
  const dkTransforms = url.searchParams.get("dkt") || "[]";
  return JSON.parse(dkTransforms) as Transform[];
}
