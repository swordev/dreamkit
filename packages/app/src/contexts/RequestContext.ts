import { IocContext } from "@dreamkit/ioc";
import { kind } from "@dreamkit/kind";

export class RequestContext extends IocContext {
  static {
    kind(this, "@dreamkit/app/RequestContext");
  }
}
