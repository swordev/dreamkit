import { createKind, getKind } from "@dreamkit/kind";

export const [iocKind, isIoc] = createKind("@dreamkit/ioc");

export class KindMap<K, V = any> extends Map<K, V> {
  protected kindMap = new Map<string, K>();
  constructor(entries?: readonly (readonly [K, V])[] | null | KindMap<K, V>) {
    super(entries);
    if (Array.isArray(entries)) {
      for (const [key] of entries) {
        const kind = getKind(key);
        if (kind) this.kindMap.set(kind, key);
      }
    } else if (entries) {
      this.kindMap = new Map((entries as KindMap<K, V>)["kindMap"]);
    }
  }
  get(key: K): V | undefined {
    const kind = getKind(key);
    if (kind !== undefined) {
      const prevKind = this.kindMap.get(kind);
      if (prevKind !== undefined) return super.get(prevKind);
    } else {
      return super.get(key);
    }
  }
  set(key: K, value: V): this {
    const kind = getKind(key);
    if (kind !== undefined) {
      const prevKind = this.kindMap.get(kind);
      if (prevKind !== undefined) super.delete(prevKind);
      this.kindMap.set(kind, key);
    }
    return super.set(key, value);
  }
  delete(key: K): boolean {
    const kind = getKind(key);
    if (kind !== undefined) {
      const prevKind = this.kindMap.get(kind);
      if (prevKind !== undefined) {
        super.delete(prevKind);
        this.kindMap.delete(kind);
      }
    }
    return super.delete(key);
  }
}
