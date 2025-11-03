import "@dreamkit/core/override/schema.js";

export interface SchemaMeta {}
interface $SchemaMeta extends SchemaMeta {}
declare module "@dreamkit/core/override/schema.js" {
  export interface SchemaMeta extends $SchemaMeta {}
}
