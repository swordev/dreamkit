import { createRoutePathRegex } from "./utils/routing.js";
import { kindTag } from "@dreamkit/kind";

export class RequestUrl<T = string> extends URL {
  protected static [kindTag] = "@dreamkit/app/RequestUrl";
  is(...paths: (keyof T)[]): boolean {
    return paths.some((path) =>
      createRoutePathRegex(path as string).test(this.pathname),
    );
  }
}
