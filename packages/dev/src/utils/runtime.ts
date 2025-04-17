import { dirname } from "path";
import { createServer, createServerModuleRunner, Plugin } from "vite";
import solidPlugin from "vite-plugin-solid";

export async function execute(path: string, plugins: Plugin[] = []) {
  const server = await createServer({
    root: dirname(path),
    plugins: [...plugins, solidPlugin({ ssr: true })],
  });
  const rt = createServerModuleRunner(server.environments.ssr, {
    hmr: { logger: false },
  });
  try {
    return await rt.import(path);
  } finally {
    await rt.close();
    await server.close();
  }
}
