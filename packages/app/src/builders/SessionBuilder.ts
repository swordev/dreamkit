import { createKind, kindOf } from "@dreamkit/kind";
import {
  InferType,
  MinimalObjectType,
  ObjectType,
  ObjectTypeProps,
  s,
} from "@dreamkit/schema";
import type { Merge, throwError } from "@dreamkit/utils/ts.js";

export const [kindSession, isSession] = createKind<SessionConstructor>(
  "@dreamkit/app/session",
);

export type SessionName = string | undefined;
export type SessionParams = MinimalObjectType | undefined;
export type InferSessionParams<T extends { params?: SessionParams }> =
  InferType<T["params"] & {}>;

export type SessionData<
  TName extends SessionName = SessionName,
  TParams extends SessionParams = SessionParams,
> = {
  name?: TName;
  params?: TParams;
};

export type SessionTimeLife = {
  seconds?: number;
  minutes?: number;
  hours?: number;
  days?: number;
};

export type SessionOptions<T extends SessionData = SessionData> = T & {
  timelife?: SessionTimeLife;
  static?: Record<string, any>;
};

export type MergeSessionData<
  D1 extends SessionData,
  D2 extends Partial<SessionData>,
> = Merge<SessionData, D1, D2>;

export abstract class Session<T extends SessionData = SessionData> {
  static get options(): SessionOptions {
    throw new Error("Not implemented");
  }
  static get params() {
    throw new Error("Not implemented");
  }
  static {
    kindSession(this);
  }
  readonly options: SessionOptions<T> = (this.constructor as any).options;
  readonly params!: InferSessionParams<T>;
  constructor(params: InferSessionParams<T>) {
    this.update(params);
  }
  update(params: InferSessionParams<T>) {
    const options = (this.constructor as SessionConstructor).options;
    const errors = (options.params as ObjectType).validate(params);
    if (errors.length)
      throw new Error(
        `Invalid '${options.name}' session: ${JSON.stringify(errors, null, 2)}`,
      );
    (this as any).params = params;
  }
}

export interface SessionConstructor<T extends SessionData = SessionData> {
  options: SessionOptions<T>;
  params: T["params"];
  new (params: InferSessionParams<T>): Session<T>;
}

export class SessionBuilder<
  T extends SessionData = { name: undefined; params: undefined },
> {
  readonly data: T;
  readonly options: SessionOptions<T>;
  constructor(options: SessionOptions<T> = {} as any) {
    this.options = options;
    this.data = {
      params: options.params,
    } as T;
  }
  protected clone(next: Partial<SessionOptions>): this {
    const prev = this.options;
    return new SessionBuilder({
      ...prev,
      ...next,
      params:
        "params" in next
          ? next.params === undefined || kindOf(next.params, ObjectType)
            ? next.params
            : (s.object(next.params as any as ObjectTypeProps) as any)
          : prev.params,
    } as any) as any;
  }
  name<TName extends SessionName>(
    value: TName,
  ): SessionBuilder<MergeSessionData<T, { name: TName }>> {
    return this.clone({ name: value }) as any;
  }
  params<TParams extends SessionParams>(
    type: TParams,
  ): SessionBuilder<MergeSessionData<T, { params: TParams }>>;
  params<TProps extends ObjectTypeProps>(
    props: TProps,
  ): SessionBuilder<MergeSessionData<T, { params: ObjectType<TProps> }>>;
  params(params: any): SessionBuilder<any> {
    return this.clone({ params });
  }
  timelife(input: SessionTimeLife): this {
    return this.clone({ timelife: input });
  }
  create: [undefined] extends [T["name"]]
    ? throwError<"Name is required">
    : [undefined] extends [T["params"]]
      ? throwError<"Params is required">
      : () => SessionConstructor<T> = function (this: SessionBuilder) {
    if (!this.options.name) throw new Error("Name is required");
    if (!this.options.params) throw new Error("Params is required");
    const self = this;
    class CustomSession extends Session<T> {
      static {
        kindSession(this, self.options.name);
      }
      static override get options(): any {
        return self.options;
      }
      static override get params(): any {
        return self.options.params;
      }
      constructor(params: InferSessionParams<T>) {
        super(params);
      }
    }
    if (this.options.static) Object.assign(CustomSession, this.options.static);
    return CustomSession;
  } as any;
}
