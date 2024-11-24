import { kindApp } from "./utils/kind.js";

export class Response {
  static {
    kindApp(this, "Response");
  }
  status?: number;
  statusText?: string;
  headers: Headers = new Headers();
}
