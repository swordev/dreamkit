import { dirname } from "path";
import { createServer, createViteRuntime, Plugin } from "vite";
import solidPlugin from "vite-plugin-solid";

export async function execute(path: string, plugins: Plugin[] = []) {
  const server = await createServer({
    root: dirname(path),
    plugins: [...plugins, solidPlugin({ ssr: true })],
  });
  const rt = await createViteRuntime(server, {
    hmr: { logger: false },
  });
  try {
    return await rt.executeUrl(path);
  } finally {
    await rt.destroy();
    await server.close();
  }
}
