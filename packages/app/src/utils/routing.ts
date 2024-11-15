export function extractPathParams(
  path: string,
): { spread: boolean; name: string; key: string; optional?: boolean }[] {
  return [...path.matchAll(/([:\*])(\w+)(\?)?/g)].map((match) => ({
    key: match[0],
    spread: match[1] === "*",
    name: match[2],
    optional: match[3] === "?",
  }));
}

export function createRoutePathRegex(path: string) {
  const paramNames = extractPathParams(path);
  let pattern = path.replace(/\//g, "\\/");
  const optionalPattern = "([^\\/]+)?";
  const endOptionalPattern = `\\/${optionalPattern}`;
  const spreadPattern = "(.*)";
  const endOptionalSpreadPattern = `\\/${spreadPattern}`;
  for (const param of paramNames) {
    if (param.spread) {
      pattern = pattern.replace(param.key, spreadPattern);
    } else if (param.optional) {
      pattern = pattern.replace(param.key, optionalPattern);
    } else {
      pattern = pattern.replace(param.key, "([^\\/]+)");
    }
  }
  if (pattern.endsWith(endOptionalSpreadPattern)) {
    pattern = pattern.slice(0, -endOptionalSpreadPattern.length) + `(\\/.*)?`;
  } else if (pattern.endsWith(endOptionalPattern)) {
    pattern = pattern.slice(0, -endOptionalPattern.length) + `(\\/[^\\/]+)?`;
  }
  return new RegExp(`^${pattern}\/?$`);
}

export function createRouteUrl(
  path: string,
  params: Record<string, any> = {},
  base = globalThis.location?.origin ?? "http://localhost",
) {
  const paramNames = extractPathParams(path);
  for (const param of paramNames)
    path = path.replaceAll(param.key, params[param.name] ?? "");

  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);

  const url = new URL(path, base);

  for (const name in params)
    if (!paramNames.find((param) => param.name === name))
      url.searchParams.set(name, params[name]);

  return url;
}

export function createRouteHref(
  path: string,
  params: Record<string, any> = {},
) {
  const url = createRouteUrl(path, params);
  return url.pathname + url.search;
}
