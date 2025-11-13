import { MinimalObjectType, ObjectType } from "../src/index.ts";
import { InferType } from "../src/infer.ts";
import { s } from "../src/s.ts";
import "./override.ts";
import { describe, expect, expectTypeOf, it } from "vitest";

function createEntityApi<T extends MinimalObjectType>(schema: T) {
  const o = schema as any as ObjectType<T["props"]>;
  const entity = {
    create: {
      input: o.query({ internal: false }),
    },
    update: {
      input: o.query({ internal: false, pk: true }).deepPartial({ pk: false }),
    },
    fetch: {
      input: o.query({ pk: true }),
      output: o.query({ secret: false }),
    },
    delete: {
      input: o.query({ pk: true }),
    },
  };
  return {
    ref: 0,
    items: [] as InferType<typeof schema>[],
    create(input: InferType<typeof entity.create.input>) {
      const id = crypto.randomUUID() as string;
      this.items.push({
        ...input,
        id,
        ref: (++this.ref).toString(),
      });
      return { id };
    },
    update(input: InferType<typeof entity.update.input>) {
      const item = this.items.find((item) => item.id === (input as any).id);
      if (!item) throw new Error("Not found");
      Object.assign(item, input);
    },
    fetch(
      input: InferType<typeof entity.fetch.input>,
    ): InferType<typeof entity.fetch.output> {
      const item = this.items.find((item) => item.id === (input as any).id);
      if (!item) throw new Error("Not found");
      return entity.fetch.output.createWith(item, ({ type, value }) =>
        type.options.secret ? undefined : value,
      );
    },
    delete(input: InferType<typeof entity.delete.input>) {
      this.items = this.items.filter((item) => item.id !== (input as any).id);
    },
  };
}

describe("crud", () => {
  const api = createEntityApi(
    s.object({
      id: s.string().flags({ pk: true, internal: false }),
      ref: s.string().flags({ internal: true }),
      name: s.string(),
      surname: s.string().nullable(),
      password: s.string().flags({ secret: true }),
    }),
  );

  it("test all methods", () => {
    const user1 = api.create({
      name: "user1",
      password: "secret1",
      surname: null,
    });

    const fetched = api.fetch({ id: user1.id });

    expectTypeOf<typeof fetched>().toEqualTypeOf<{
      id: string;
      ref: string;
      name: string;
      surname: string | null;
    }>();

    expect(fetched).toEqual({
      id: user1.id,
      ref: "1",
      name: "user1",
      surname: null,
    });

    api.update({
      id: user1.id,
      password: "newPassword",
    });

    expect(api.items.find((item) => item.id === user1.id)?.password).toBe(
      "newPassword",
    );

    api.delete({ id: user1.id });
    expect(api.items.length).toBe(0);
  });
});
