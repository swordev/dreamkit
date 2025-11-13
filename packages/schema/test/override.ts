declare module "@dreamkit/schema/override.js" {
  export interface SchemaMeta {
    info?: string;
    info2?: string;
  }
  export interface SchemaFlags {
    pk?: boolean;
    internal?: boolean;
    secret?: boolean;
  }
}
