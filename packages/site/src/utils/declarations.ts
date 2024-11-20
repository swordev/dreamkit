export function normalizeDeclaration(value: string) {
  const pattern = 'declare module "dreamkit/definitions" {';
  let declaring = false;
  return value
    .split("\n")
    .map((line) => {
      if (line === pattern) {
        declaring = true;
        return null;
      } else if (declaring) {
        if (line === "}\n") {
          declaring = false;
          return null;
        } else return line.startsWith("  ") ? line.slice(2) : line;
      } else {
        return line;
      }
    })
    .filter((v) => typeof v === "string")
    .join("\n")
    .replace(/}\n$/, "");
}
