export function replaceText(
  source: string,
  start: number,
  end: number,
  value: string,
) {
  return source.slice(0, start) + value + source.slice(end);
}
