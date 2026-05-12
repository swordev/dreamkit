import { IocContext } from "@dreamkit/ioc";
import { kindTag } from "@dreamkit/kind";

export class AppContext extends IocContext {
  protected static [kindTag] = "@dreamkit/app/AppContext";
}
