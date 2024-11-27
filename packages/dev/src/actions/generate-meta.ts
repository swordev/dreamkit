import { DreamkitDevServer } from "../DreamkitDevServer.js";
import { writeFileIfDifferent } from "../utils/fs.js";
import {
  createInterface,
  createModuleDeclaration,
  createType,
} from "../utils/typescript.js";
import { RouteParams } from "@dreamkit/app/builders/RouteBuilder.js";
import { ObjectType } from "@dreamkit/schema";
import { mkdir } from "fs/promises";
import { dirname } from "path";

export async function generateMeta(server: DreamkitDevServer) {
  const options = server.options;
  const output =
    options.metaFormat === "global"
      ? options.metaGlobalOutput
      : options.metaLocalOutput;

  const routeDef = [...server.app.routes]
    .map((route) => ({
      path: route.$options.path ?? "",
      params: route.$options.params,
    }))
    .sort((a, b) => a.path.localeCompare(b.path));

  const typeRoutes = await generateDefinition(routeDef);

  let contents: string;
  if (options.metaFormat === "global") {
    const declarations: Record<string, string> = {
      ["dreamkit/scopes/global.override.js"]: createInterface(
        "Routing",
        typeRoutes,
        1,
      ),
    };
    contents =
      Object.entries(declarations)
        .map(
          ([source, body]) =>
            `// prettier-ignore\n` + createModuleDeclaration(source, [body]),
        )
        .join("\n\n") + "\n";
  } else {
    contents = [
      `// prettier-ignore`,
      `import { defineRoutePath } from "dreamkit/scopes/common.js";`,
      `import { defineLink } from "dreamkit/scopes/solid.js";`,
      "",
      ...(options.metaLocalExports
        ? [
            'export * from "dreamkit/scopes/common.js";',
            'export * from "dreamkit/scopes/solid.js";',
          ]
        : []),
      createInterface("Routing", typeRoutes, 0),
      "export const routePath = defineRoutePath<Routing>();",
      "export const Link = defineLink<Routing>();",
    ].join("\n");
  }

  await mkdir(dirname(output), { recursive: true });
  const changed = await writeFileIfDifferent(output, contents);
  return {
    path: output,
    changed,
  };
}

async function generateDefinition(
  routes: { path: string; params?: RouteParams }[],
) {
  const result: Record<string, string> = {};
  for (const route of routes) {
    if (route.path.includes("*404")) continue;
    const params = route.params as ObjectType | undefined;
    result[route.path] = Object.keys(params?.options.props || {}).length
      ? createType(params!)
      : "never";
  }
  return result;
}
