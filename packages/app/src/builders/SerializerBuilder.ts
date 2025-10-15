import { createKind } from "@dreamkit/kind";

export const [kindSerializer, isSerializer] = createKind(
  "@dreamkit/app/serializer",
);

export type SerializerData<I = any, O = any> = {
  key: string;
  is(input: any): input is I;
  to(input: I): O;
  from(output: O): I;
  priority?: number;
};

export class Serializer<I = any, O = any> {
  static {
    kindSerializer(this);
  }
  constructor(readonly config: SerializerData<I, O>) {}
}

export class SerializerBuilder {
  create<I, O>(data: SerializerData<I, O>): Serializer<I, O> {
    return new Serializer(data);
  }
}
