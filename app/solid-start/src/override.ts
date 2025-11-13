import "dreamkit/override/schema.js";

declare module "dreamkit/override/schema.js" {
  export interface SchemaMeta {
    data?: string;
  }
  export interface SchemaFlags {
    internal?: boolean;
  }
}
