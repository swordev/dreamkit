export function toBase64(input: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(input)));
}

export function fromBase64(input: string): Uint8Array {
  return Uint8Array.from(atob(input), (c) => c.charCodeAt(0));
}
