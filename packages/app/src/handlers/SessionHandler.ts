import {
  InferSessionParams,
  SessionConstructor,
  SessionData,
} from "../builders/SessionBuilder.js";
import { createIocClass } from "@dreamkit/ioc";
import { createIsKind, kindTag } from "@dreamkit/kind";
import { Constructor } from "@dreamkit/utils/ts.js";

const tag = "@dreamkit/app/SessionHandler";
export const isSessionHandler = createIsKind<SessionHandlerConstructor>(tag);

export type SessionHandlerConstructor = Constructor<SessionHandler> & {
  $ioc: any;
};

export abstract class SessionHandler {
  protected static [kindTag] = tag;
  async get<T extends SessionData>(
    constructor: SessionConstructor<T>,
  ): Promise<InferSessionParams<T> | undefined> {
    return await this.onGet(constructor);
  }
  async unset(constructor: SessionConstructor<any>): Promise<void> {
    await this.onSet(constructor, undefined);
  }
  async set<T extends SessionData>(
    constructor: SessionConstructor<T>,
    value: InferSessionParams<T> | null | undefined,
  ): Promise<void> {
    await this.onSet(constructor, value);
  }
  protected abstract onGet(constructor: SessionConstructor<any>): Promise<any>;
  protected abstract onSet(
    constructor: SessionConstructor<any>,
    params: any,
  ): Promise<unknown>;
}

export const SessionHandlerClass = createIocClass(SessionHandler);
