import {
  CustomType,
  MinimalObjectType,
  ObjectType,
  TypeFlag,
} from "../src/index.ts";
import { InferType } from "../src/infer.ts";
import { s } from "../src/s.ts";
import { QueryObjectType } from "../src/types/ObjectType.ts";
import { DeepMergeFlags } from "../src/utils/object-type.ts";
import "./override.ts";
import { describe, expect, expectTypeOf, it } from "vitest";

type EntitySchema<T extends MinimalObjectType> = {
  create: {
    input: QueryObjectType<T, { internal: false }>;
    output: QueryObjectType<T, { pk: true }>;
  };
  update: {
    input: DeepMergeFlags<
      QueryObjectType<T, { internal: false; pk: true }>,
      TypeFlag.Name.Optional,
      { pk: false },
      false
    >;
    output: CustomType<void>;
  };
  fetch: {
    input: QueryObjectType<T, { pk: true }>;
    output: QueryObjectType<T, { secret: false }>;
  };
  delete: {
    input: QueryObjectType<T, { pk: true }>;
    output: CustomType<void>;
  };
};

type EntityApi<T extends MinimalObjectType> = {
  ref: number;
  items: InferType<T>[];
} & {
  [K in keyof EntitySchema<T>]: (
    params: InferType<EntitySchema<T>[K]["input"]>,
  ) => Promise<InferType<EntitySchema<T>[K]["output"]>>;
};

function compareObjects(a: any, b: any): boolean {
  for (const key in a) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

function createEntityApi<T extends MinimalObjectType>(schema: T): EntityApi<T> {
  const o = schema as any as ObjectType<T["props"]>;
  const pk = o.query({ pk: true });
  const apiSchema = {
    create: {
      input: o.query({ internal: false }),
      output: pk,
    },
    update: {
      input: o.query({ internal: false, pk: true }).deepPartial({ pk: false }),
    },
    fetch: {
      input: pk,
      output: o.query({ secret: false }),
    },
    delete: {
      input: pk,
    },
  } as any as EntitySchema<T>;

  const createContext = (action: string) => ({
    data: {
      action: () => action,
      ref: () => (++api.ref).toString(),
    },
    resolve(key: string) {
      if (key in this.data) {
        return (this.data as any)[key]();
      }
    },
  });

  const api: EntityApi<T> = {
    ref: 0,
    items: [] as InferType<typeof schema>[],
    async create(data) {
      const ctx = createContext("create");
      const item = await o.createWithAsync({
        data,
        map: ({ type, value }) =>
          type.options.internal ? type.options.meta?.defaults?.(ctx) : value,
      });
      this.items.push(item);
      return pk.fit(item);
    },
    async update(data) {
      const pattern = pk.fit(data as any);
      const item = this.items.find((item) =>
        compareObjects(pattern, pk.fit(item)),
      );
      if (!item) throw new Error("Not found");
      const ctx = createContext("update");
      const patch = await o.createWithAsync({
        data,
        map: ({ type, value }) =>
          type.options.internal ? type.options.meta?.defaults?.(ctx) : value,
      });
      Object.assign(item, patch);
    },
    async fetch(input) {
      const pattern = pk.fit(input as any);
      const item = this.items.find((item) =>
        compareObjects(pattern, pk.fit(item)),
      );
      if (!item) throw new Error("Not found");
      return apiSchema.fetch.output.createWith({
        data: item,
        map: ({ type, value }) => (type.options.secret ? undefined : value),
      });
    },
    async delete(input) {
      this.items = this.items.filter((item) => item.id !== (input as any).id);
    },
  };

  return api as any;
}

describe("crud", () => {
  const api = createEntityApi(
    s.object({
      id: s
        .string()
        .flags({ pk: true, internal: false })
        .meta({
          defaults: (ctx) =>
            ctx.resolve("action") === "create"
              ? crypto.randomUUID()
              : undefined,
        }),
      creationDate: s
        .string()
        .flags({ internal: true })
        .meta({
          defaults: (ctx) =>
            ctx.resolve("action") === "create"
              ? new Date().toISOString()
              : undefined,
        }),
      ref: s
        .string()
        .flags({ internal: true })
        .meta({
          defaults: (ctx) =>
            ctx.resolve("action") === "create" ? ctx.resolve("ref") : undefined,
        }),
      name: s.string(),
      surname: s.string().nullable(),
      password: s.string().flags({ secret: true }),
    }),
  );

  it("test all methods", async () => {
    const user1 = await api.create({
      name: "user1",
      password: "secret1",
      surname: null,
    });

    const fetched = await api.fetch({ id: user1.id });

    expectTypeOf<typeof fetched>().toEqualTypeOf<{
      id: string;
      ref: string;
      name: string;
      creationDate: string;
      surname: string | null;
    }>();

    const { creationDate, ...other } = fetched;
    expect(other).toEqual({
      id: user1.id,
      ref: "1",
      name: "user1",
      surname: null,
    });
    expect(typeof creationDate).toBe("string");

    await api.update({
      id: user1.id,
      password: "newPassword",
    });

    expect(api.items.find((item) => item.id === user1.id)?.password).toBe(
      "newPassword",
    );

    await api.delete({ id: user1.id });
    expect(api.items.length).toBe(0);
  });
});
