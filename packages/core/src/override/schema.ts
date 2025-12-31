export interface SchemaMeta {}
export interface SchemaFlags {}
export interface SchemaFactory {}

interface $SchemaMeta extends SchemaMeta {}
interface $SchemaFlags extends SchemaFlags {}
interface $SchemaFactory extends SchemaFactory {}

declare module "@dreamkit/schema/override.js" {
  export interface SchemaMeta extends $SchemaMeta {}
  export interface SchemaFlags extends $SchemaFlags {}
  export interface SchemaFactory extends $SchemaFactory {}
}
