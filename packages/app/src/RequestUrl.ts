import { kindApp } from "./utils/kind.js";

export class RequestUrl<T = string> extends URL {
  static {
    kindApp(this, "RequestUrl");
  }
  is(...paths: (keyof T)[]): boolean {
    // [review]
    return paths.includes(this.pathname as any);
  }
}
