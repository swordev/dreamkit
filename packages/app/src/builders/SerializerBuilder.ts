import { BlobRefs } from "../EJSON.js";
import { createIsKind, kindTag } from "@dreamkit/kind";

const tag = "@dreamkit/app/serializer";
export const isSerializer = createIsKind<Serializer>(tag);

export type SerializerData<I = any, O = any> = {
  key: string;
  is(input: any): input is I;
  to(input: I, blobs: Blob[]): O;
  from(output: O, blobRefs: BlobRefs): I;
  priority?: number;
};

export class Serializer<I = any, O = any> {
  protected static [kindTag] = tag;
  constructor(readonly config: SerializerData<I, O>) {}
}

export class SerializerBuilder {
  create<I, O>(data: SerializerData<I, O>): Serializer<I, O> {
    return new Serializer(data);
  }
}
