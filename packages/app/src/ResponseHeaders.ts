import { kindApp } from "./utils/kind.js";

export class ResponseHeaders extends Headers {
  static {
    kindApp(this, "ResponseHeaders");
  }
}
