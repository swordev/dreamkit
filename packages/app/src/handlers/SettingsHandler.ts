import {
  InferSettingsParams,
  SettingsConstructor,
  SettingsData,
} from "../builders/SettingsBuilder.js";
import { createIocClass, IocClass, IocContext } from "@dreamkit/ioc";
import { createKind } from "@dreamkit/kind";
import { Constructor } from "@dreamkit/utils/ts.js";

export const [kindSettingsHandler, isSettingsHandler] =
  createKind<SettingsHandlerConstructor>("@dreamkit/app/SettingsHandler");

export type SettingsHandlerConstructor = Constructor<SettingsHandler> & {
  $ioc: any;
};

export type SettingsHandlerSaveResult = Record<
  string,
  { path: string; changed: boolean }
>;

export abstract class SettingsHandler extends IocClass({ IocContext }) {
  static {
    kindSettingsHandler(this);
  }
  autoSave = true;
  protected data: Record<string, any> = {};
  protected settings: Set<SettingsConstructor> = new Set();
  protected pending: string[] = [];
  protected abstract onLoad(): Promise<Record<string, any>>;
  protected abstract onSave(): Promise<SettingsHandlerSaveResult>;
  async load() {
    this.data = await this.onLoad();
    for (const settings of this.settings) {
      const data = this.data[settings.options.name!];
      this.iocContext.resolve(settings, { optional: true })?.update(data);
    }
  }
  async get<T extends SettingsData>(
    constructor: SettingsConstructor<T>,
  ): Promise<InferSettingsParams<T>> {
    return this.data[constructor.options.name!];
  }
  async set<T extends SettingsData>(
    constructor: SettingsConstructor<T>,
    data: InferSettingsParams<T>,
  ): Promise<void> {
    const settingsInstance = this.iocContext.resolve(constructor, {
      optional: true,
    });
    if (settingsInstance) {
      settingsInstance.update(data);
    } else {
      this.iocContext.register(constructor, {
        value: new constructor(data),
      });
    }
    if (this.autoSave) {
      await this.onSave();
    } else {
      const name = constructor.options.name!;
      this.data[name] = data;
      this.pending.push(name);
    }
  }
  async save(): Promise<SettingsHandlerSaveResult> {
    this.autoSave = true;
    const result = await this.onSave();
    this.pending.splice(0, this.pending.length);
    return result;
  }
  protected async getData(): Promise<{
    prev: Record<string, any> | undefined;
    next: Record<string, any> | undefined;
  }> {
    if (!this.pending.length) return { prev: undefined, next: undefined };
    const prev = await this.onLoad();
    const patch = Object.fromEntries(
      Object.entries(this.data).filter(([name]) => this.pending.includes(name)),
    );
    const next = Object.fromEntries(
      Object.entries(prev).map(([name, value]) => [name, patch[name] ?? value]),
    );
    for (const name in patch) if (!(name in next)) next[name] = patch[name];
    return { prev, next };
  }
}

export const SettingsHandlerClass = createIocClass(SettingsHandler);
