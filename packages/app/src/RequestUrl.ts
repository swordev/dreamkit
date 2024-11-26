import { kindApp } from "./utils/kind.js";
import { createRoutePathRegex } from "./utils/routing.js";

export class RequestUrl<T = string> extends URL {
  static {
    kindApp(this, "RequestUrl");
  }
  is(...paths: (keyof T)[]): boolean {
    return paths.some((path) =>
      createRoutePathRegex(path as string).test(this.pathname),
    );
  }
}
