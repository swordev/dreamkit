import { IocContext } from "@dreamkit/ioc";
import { kindTag } from "@dreamkit/kind";

export class RequestContext extends IocContext {
  protected static [kindTag] = "@dreamkit/app/RequestContext";
}
