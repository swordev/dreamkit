export interface SchemaMeta {}
interface $SchemaMeta extends SchemaMeta {}
declare module "@dreamkit/schema/override.js" {
  export interface SchemaMeta extends $SchemaMeta {}
}
