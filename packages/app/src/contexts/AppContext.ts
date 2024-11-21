import { IocContext } from "@dreamkit/ioc";
import { kind } from "@dreamkit/kind";

export class AppContext extends IocContext {
  static {
    kind(this, "@dreamkit/app/AppContext");
  }
}
