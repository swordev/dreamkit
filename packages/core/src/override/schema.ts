export interface SchemaMeta {}
export interface SchemaFlags {}

interface $SchemaMeta extends SchemaMeta {}
interface $SchemaFlags extends SchemaFlags {}

declare module "@dreamkit/schema/override.js" {
  export interface SchemaMeta extends $SchemaMeta {}
  export interface SchemaFlags extends $SchemaFlags {}
}
