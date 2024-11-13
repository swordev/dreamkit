import { DreamkitDevServer } from "./DreamkitDevServer.js";
import { generate } from "./actions/generate.js";
import { fetchDreamkitDevOptions } from "./adapters/solid-start/dev-server.js";
import { createCommand } from "commander";
import { relative, resolve } from "path";

const program = createCommand();

export type GlobalOptions = {
  cwd: string;
};

function globalOptions(): GlobalOptions & { root: string } {
  const global = program.optsWithGlobals<GlobalOptions>();
  return {
    ...global,
    root: resolve(global.cwd).replaceAll("\\", "/"),
  };
}

program.option("--cwd [dir]", "working dir", ".");

program
  .command("generate")
  .alias("gen")
  .action(async () => {
    const global = globalOptions();
    const options = await fetchDreamkitDevOptions({
      root: global.root,
    });
    const server = new DreamkitDevServer(options);
    try {
      await server.prepare();
      const result = await generate(server);
      const outputPath = relative(process.cwd(), result.output).replaceAll(
        "\\",
        "/",
      );
      console.info(
        [
          `Generated: ${outputPath}`,
          !result.changed ? " (no changes)" : "",
        ].join(""),
      );
    } finally {
      await server.stop();
    }
  });

program.parse(process.argv);
