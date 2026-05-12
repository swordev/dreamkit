import { kindTag } from "@dreamkit/kind";

export class Response {
  protected static [kindTag] = "@dreamkit/app/Response";
  status?: number;
  statusText?: string;
  headers: Headers = new Headers();
}
