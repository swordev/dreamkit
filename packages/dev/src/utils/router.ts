import { analyzeModule } from "./ast.js";
import { globStream } from "glob";
import { join } from "path";

export type Route = { filePath: string; path: string };

export function getRoutePath(file: string) {
  const path = file
    .replaceAll("\\", "/")
    .split(".")
    .slice(0, -1)
    .join(".")
    .replace(/index$/, "")
    .replace(/\[([^\/]+)\]/g, (_, m) => {
      if (m.length > 3 && m.startsWith("...")) {
        return `*${m.slice(3)}`;
      }
      if (m.length > 2 && m.startsWith("[") && m.endsWith("]")) {
        return `:${m.slice(1, -1)}?`;
      }
      return `:${m}`;
    });

  return path.length > 0 ? `/${path}` : "/";
}

export async function findFileRoutes(
  cwd: string,
  extensions = ["tsx", "jsx", "js", "ts"],
) {
  const filesStream = globStream(`**/*.{${extensions}}`, { cwd });
  const routes: Route[] = [];
  for await (const file of filesStream) {
    const filePath = join(cwd, file);
    const [_, exports] = await analyzeModule(filePath);
    //const hasDefault = !!exports.find((e) => e.n === "default");
    //if (hasDefault) {
    routes.push({
      filePath,
      path: getRoutePath(file),
    });
    //}
  }
  return routes;
}
