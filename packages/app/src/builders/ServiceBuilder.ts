import { createIocClass, IocClass, IocParamsUserConfig } from "@dreamkit/ioc";
import { createKind } from "@dreamkit/kind";
import type { Constructor, Merge } from "@dreamkit/utils/ts.js";

export const [kindService, isService] = createKind<ServiceConstructor>(
  "@dreamkit/app/service",
);

export type ServiceSelf = IocParamsUserConfig | undefined;
export type ServiceData<TSelf extends ServiceSelf = ServiceSelf> = {
  self?: TSelf;
  deps?: ServiceConstructor[];
  priority?: number;
};

export type ServiceOptions<T extends ServiceData = ServiceData> = T & {
  static?: Record<string, any>;
};

export type MergeServiceData<
  D1 extends ServiceData,
  D2 extends Partial<ServiceData>,
> = Merge<ServiceData, D1, D2>;

type SyncOrAsync<T> = T | Promise<T>;
export type Shutdown = () => SyncOrAsync<void>;
export type AppService = {
  name: string;
  service: ServiceConstructor;
  started: boolean;
  shutdown?: Shutdown;
  options: ServiceOptions;
};

export abstract class Service {
  static {
    kindService(this);
  }
  abstract onStart(): any;
}

export type ServiceConstructor = Constructor<Service>;

const ServiceClass = createIocClass(Service);

export class ServiceBuilder<T extends ServiceData = {}> {
  readonly data: T;
  readonly options: ServiceOptions<T>;
  constructor(options: ServiceOptions<T> = {} as any) {
    const $this = this;
    this.options = options;
    this.data = {
      get self() {
        return $this.options.self;
      },
    } as T;
  }
  protected clone(next: Partial<ServiceOptions>): this {
    const prev = this.options;
    return new ServiceBuilder({
      ...prev,
      ...next,
    }) as this;
  }
  self<TSelf extends ServiceSelf>(
    value: TSelf,
  ): ServiceBuilder<MergeServiceData<T, { self: TSelf }>> {
    return this.clone({ self: value }) as any;
  }
  deps(deps: ServiceConstructor[]): this {
    return this.clone({ deps }) as any;
  }
  priority(priority: number): this {
    return this.clone({ priority }) as any;
  }
  create(): IocClass<T["self"] & {}, Service> {
    const Class = ServiceClass(this.options.self || {}) as any;
    Object.assign(Class, { $options: this.options });
    if (this.options.static) Object.assign(Class, this.options.static);
    return Class;
  }
}
