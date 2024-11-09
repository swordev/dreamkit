import { basename, dirname, isAbsolute, join } from "path";

export function resolvePath(
  inPath: string,
  vars: Record<string, string> & { defaults: string },
) {
  let path = inPath;
  for (const name in vars) path = path.replace(`{${name}}`, vars[name]);
  return isAbsolute(path) ? path : join(vars.defaults, path);
}

export function getExt(path: string) {
  const name = basename(path);
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop() : undefined;
}

export function getVariantPath(path: string, variant: string) {
  const dir = dirname(path);
  const name = basename(path);
  const ext = getExt(name);
  const nameWithoutExt = ext ? name.slice(0, -ext.length - 1) : name;
  return join(
    dir,
    ext ? `${nameWithoutExt}.${variant}.${ext}` : `${name}.${variant}`,
  );
}
