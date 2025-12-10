import { tryReadJsonFile, writeFileIfDifferent } from "./utils/fs.js";
import { SettingsHandlerClass } from "@dreamkit/app";
import { iocParam } from "@dreamkit/ioc";
import { kind } from "@dreamkit/kind";
import { ObjectType } from "@dreamkit/schema";
import { basename } from "path";

export class NodeSettingsHandlerOptions {
  static {
    kind(this, "@dreamkit/node-app/NodeSettingsHandlerOptions");
  }
  constructor(
    readonly data: {
      path: string;
    },
  ) {}
}

export class NodeSettingsHandler extends SettingsHandlerClass({
  options: iocParam(NodeSettingsHandlerOptions).optional(),
}) {
  static {
    kind(this, "@dreamkit/node-app/NodeSettingsHandler");
  }
  protected async onLoad() {
    const settingsPath = this.getSettingsPath();
    return (await tryReadJsonFile(settingsPath)) || {};
  }
  protected override async onSave() {
    const { prev, next } = await this.getData();
    const schemaPath = this.getSettingsSchemaPath();
    return {
      "settings-data": {
        path: this.getSettingsPath(),
        changed:
          !!next &&
          (await writeFileIfDifferent(
            this.getSettingsPath(),
            JSON.stringify(
              {
                $schema: `./${basename(schemaPath)}`,
                ...next,
              },
              null,
              2,
            ),
            prev ? JSON.stringify(prev, null, 2) : undefined,
          )),
      },
      "settings-schema": {
        path: schemaPath,
        changed: await writeFileIfDifferent(
          schemaPath,
          JSON.stringify(this.getSettingsSchema(), null, 2),
        ),
      },
    };
  }
  protected getSettingsPath() {
    return (
      this.options?.data.path ??
      process.env.DK_SETTINGS_PATH ??
      "./settings.json"
    );
  }
  protected getSettingsSchemaPath() {
    return this.getSettingsPath().replace(/\.json$/, ".schema.json");
  }
  protected getSettingsSchema(): Record<string, any> {
    const schema = {
      type: "object",
      additionalProperties: false,
      required: [] as string[],
      properties: {
        $schema: { type: "string" },
      } as Record<string, any>,
    };

    const properties: Record<string, any> = {};

    for (const value of this.settings) {
      const options = value.options;
      if (!options.optional) schema.required.push(options.name!);
      properties[options.name!] = (options.params as ObjectType).toJsonSchema();
    }

    schema.required.sort();

    for (const name of Object.keys(properties).sort()) {
      schema.properties[name] = properties[name];
    }

    return schema;
  }
}
