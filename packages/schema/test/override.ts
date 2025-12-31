import { StringType } from "@dreamkit/schema";

declare module "@dreamkit/schema/override.js" {
  export interface SchemaMeta {
    info?: string;
    info2?: string;
    defaults?: (ctx: { resolve: (key: string) => any }) => any;
  }
  export interface SchemaFlags {
    pk?: boolean;
    internal?: boolean;
    secret?: boolean;
  }
  export interface SchemaFactory {
    uuid(): StringType;
  }
}
