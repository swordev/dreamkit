import { createIocClass } from "@dreamkit/ioc";
import { createKind } from "@dreamkit/kind";
import { Constructor } from "@dreamkit/utils/ts.js";

export const [kindService, isService] = createKind<ServiceConstructor>(
  "@dreamkit/app/service",
);

type SyncOrAsync<T> = T | Promise<T>;
export type Shutdown = () => SyncOrAsync<void>;
export type AppService = {
  name: string;
  service: ServiceConstructor;
  started: boolean;
  shutdown?: Shutdown;
};
export type ServiceStop = SyncOrAsync<void> | Shutdown;
export type ServiceConstructor = Constructor<Service>;
export abstract class Service {
  static {
    kindService(this);
  }
  get name(): string | undefined {
    return;
  }
  abstract onStart(): ServiceStop;
  onStop(): any {}
}

export const ServiceClass = createIocClass(Service);
