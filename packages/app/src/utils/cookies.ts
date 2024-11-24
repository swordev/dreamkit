export type Cookie = {
  name: string;
  value?: string;
  expires?: Date;
  maxAge?: number;
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: string;
};

export function encodeCookie(cookie: Cookie) {
  return (
    `${cookie.name || ""}=${cookie.value || ""}` +
    (cookie.expires != null
      ? `; Expires=${cookie.expires.toUTCString()}`
      : "") +
    ((cookie.maxAge ?? null != null) ? `; Max-Age=${cookie.maxAge}` : "") +
    ((cookie.domain ?? null != null) ? `; Domain=${cookie.domain}` : "") +
    ((cookie.path ?? null != null) ? `; Path=${cookie.path}` : "") +
    (cookie.secure ? "; Secure" : "") +
    (cookie.httpOnly ? "; HttpOnly" : "") +
    ((cookie.sameSite ?? null != null) ? `; SameSite=${cookie.sameSite}` : "")
  );
}

export function decodeCookie(cookie: string) {
  const indexOfEquals = cookie.indexOf("=");
  let name;
  let value;
  if (indexOfEquals === -1) {
    name = "";
    value = cookie.trim();
  } else {
    name = cookie.slice(0, indexOfEquals).trim();
    value = cookie.slice(indexOfEquals + 1).trim();
  }
  const firstQuote = value.indexOf('"');
  const lastQuote = value.lastIndexOf('"');
  if (firstQuote !== -1 && lastQuote !== -1) {
    value = value.substring(firstQuote + 1, lastQuote);
  }
  return { name, value };
}

export function decodeCookies(cookies: string) {
  const object = new Map<string, string>();
  for (const cookie of cookies.split(";")) {
    const { name, value } = decodeCookie(cookie);
    if (name.length) object.set(name, value);
  }
  return object;
}
