import { Serializer } from "./builders/SerializerBuilder.js";
import { isPlainObject } from "@dreamkit/utils/object.js";

export type EJSONEncodedObject = { $ejson: string; $value: any };
export type BlobRef = { path: string; size: number };
export type BlobRefs = Record<number, BlobRef>;

function isEJSONObject(
  input: Record<string, any>,
): input is EJSONEncodedObject {
  return "$ejson" in input && "$value" in input;
}

export class EJSON {
  #serializers: Serializer[] = [];
  #serializersValue: readonly Serializer[] | undefined;
  get serializers(): readonly Serializer[] {
    if (!this.#serializersValue)
      this.#serializersValue = [...this.#serializers].sort(
        (a, b) => (b.config.priority || 0) - (a.config.priority || 0),
      );
    return this.#serializersValue;
  }
  constructor(serializers: Serializer[]) {
    this.#serializers = [...serializers];
  }
  add(serializer: Serializer) {
    this.remove(serializer.config.key);
    this.#serializers.push(serializer);
    this.#serializersValue = undefined;
  }
  remove(name: string) {
    this.#serializers = this.serializers.filter((s) => s.config.key !== name);
    this.#serializersValue = undefined;
  }
  clear() {
    this.#serializers = [];
    this.#serializersValue = undefined;
  }
  encode(input: any, blobs: Blob[] = []): any {
    if (isPlainObject(input)) {
      const object: Record<string, any> = {};
      for (const key in input) {
        object[key] = this.encode(input[key]);
      }
      return object;
    } else if (Array.isArray(input)) {
      return input.map((item) => this.encode(item));
    } else if (typeof input === "object" && input !== null) {
      for (const serializer of this.serializers) {
        if (serializer.config.is(input)) {
          return {
            $ejson: serializer.config.key,
            $value: serializer.config.to(input, blobs),
          } satisfies EJSONEncodedObject;
        }
      }
    }
    return input;
  }
  decode(
    input: any,
    options: {
      blobRefs?: BlobRefs;
      onDecoded?: (input: any) => void;
    } = {},
  ): any {
    if (isPlainObject(input)) {
      if (isEJSONObject(input)) {
        const serializer = this.serializers.find(
          (s) => s.config.key === input.$ejson,
        );
        if (!serializer) throw new Error(`Unknown EJSON type: ${input.$ejson}`);
        const decoded = serializer.config.from(
          input.$value,
          options.blobRefs ?? {},
        );
        options.onDecoded?.(decoded);
        return decoded;
      } else {
        const object: Record<string, any> = {};
        for (const key in input) object[key] = this.decode(input[key], options);
        return object;
      }
    } else if (Array.isArray(input)) {
      return input.map((item) => this.decode(item, options));
    } else {
      return input;
    }
  }
  parse(input: string): any {
    const json = JSON.parse(input);
    return this.decode(json);
  }
  stringify(value: any): string {
    const ejson = this.encode(value);
    return JSON.stringify(ejson);
  }
}
