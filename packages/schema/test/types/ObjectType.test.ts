import { InferType, NumberType, StringType, s } from "../../src/index.js";
import { describe, expect, expectTypeOf, it } from "vitest";

describe("object.type", () => {
  it("return type", () => {
    expect(s.object({}).kind).toBe("object");
  });
});

describe("object.title", () => {
  it("return title", () => {
    expect(s.object({}).title("test").options.title);
  });
});

describe("object.clone", () => {
  it("clone the options", () => {
    const o1 = s.object({ name: s.string() });
    const o2 = o1["clone"]();
    expect(o1.options === o2.options).toBeFalsy();
    expect(o1.options.props === o2.options.props).toBeFalsy();
  });
});

describe("object.props", () => {
  it("use the same reference", () => {
    const o1 = s.object({ name: s.string() });
    expect(o1.props).toBe(o1.options.props as any);
  });
});

describe("object.test", () => {
  it("return true", () => {
    const $ = s.object({});
    expect($.test({})).toBeTruthy();
  });
  it("test with props option", () => {
    const $ = s.object({
      key: s.string(),
    });
    expect($.test({})).toBeFalsy();
    expect($.test({ key: 1 })).toBeFalsy();
    expect($.test({ key: "" })).toBeTruthy();
  });
  it("test with additional property", () => {
    const $ = s.object({
      key: s.string(),
    });
    expect($.test({})).toBeFalsy();
    expect($.test({ key: "", key2: "" })).toBeFalsy();
  });
  it("test with nullable option", () => {
    const $ = s.object({}).nullable();
    expect($.test({})).toBeTruthy();
    expect($.test(null)).toBeTruthy();
    expect($.test(undefined)).toBeFalsy();
  });
  it("test with optional option", () => {
    const $ = s.object({}).optional();
    expect($.test({})).toBeTruthy();
    expect($.test(undefined)).toBeTruthy();
    expect($.test(null)).toBeFalsy();
  });
  it("test non object values", () => {
    const $ = s.object({});
    expect($.test(true)).toBeFalsy();
    expect($.test(false)).toBeFalsy();
    expect($.test(1)).toBeFalsy();
    expect($.test(null)).toBeFalsy();
    expect($.test(undefined)).toBeFalsy();
    expect($.test([])).toBeFalsy();
    expect($.test("")).toBeFalsy();
    expect($.test(new String())).toBeFalsy();
  });
  it("test invalid number", () => {
    const $ = s.object({
      a: s.number().max(9),
    });
    expect($.test({ a: 10 })).toBeFalsy();
  });
});

describe("object.require", () => {
  it("create deep nullish", () => {
    const $ = s
      .object({ a: s.string(), b: s.string() })
      .deepPartial()
      .require({ a: true });
    expect($.props.a.flagsValue).toEqual({});
    expect($.props.b.flagsValue).toEqual({ optional: true });
  });
});

describe("object.create", () => {
  it("create safe object", () => {
    const $ = s.object({ a: s.string(), b: s.string() });
    expect($.create({ a: "", b: "" })).toEqual({ a: "", b: "" });
    // @ts-expect-error
    expect($.create({ a: 1, b: "" })).toEqual({ a: 1, b: "" });
  });
});

describe("object.createWith", () => {
  it("create defauts object", () => {
    const $ = s.object({
      enabled: s.bool(),
      profile: s.object({
        name: s.string(),
        surname: s.string().nullable(),
        country: s.string(),
      }),
      location: s
        .object({
          address: s.string(),
        })
        .nullable(),
    });

    const defaults = $.createWith(
      {
        profile: {
          country: "Spain",
        },
      },
      ({ type, value }) => {
        if (value !== undefined) {
          return value;
        } else if (type.options.nullable) {
          return null;
        } else if (type.kind === "bool") {
          return false;
        } else if (type.kind === "string") {
          return "";
        }
      },
    );

    expect(defaults).toEqual(
      $.create({
        enabled: false,
        profile: {
          name: "",
          surname: null,
          country: "Spain",
        },
        location: null,
      }),
    );
  });
  it("create custom object", () => {
    const $ = s.object({
      a: s.string(),
      b: s.string(),
      c: s.object({
        d: s.bool(),
        e: s
          .object({
            f: s.string(),
          })
          .nullable(),
        g: s.object({
          h: s.string(),
        }),
      }),
    });
    expect(
      $.createWith(
        {
          c: {
            d: "D",
          },
        },
        (data) => data.value ?? data.name,
      ),
    ).toEqual({
      a: "a",
      b: "b",
      c: {
        d: "D",
        e: "c.e",
        g: {
          h: "c.g.h",
        },
      },
    });
  });
});

describe("object.partial", () => {
  it("create partial type", () => {
    const $ = s.object({ a: s.string(), b: s.string() }).partial({ a: true });
    expectTypeOf<InferType<typeof $>>().toEqualTypeOf<{
      a?: string;
      b: string;
    }>();
    expect($.props.a.flagsValue).toEqual({ optional: true });
    expect($.props.b.flagsValue).toEqual({});
  });

  it("create fullpartial type", () => {
    const $ = s
      .object({
        a: s.string(),
        b: s.string(),
        c: s.object({
          d: s.string(),
        }),
      })
      .partial();
    expectTypeOf<InferType<typeof $>>().toEqualTypeOf<{
      a?: string;
      b?: string;
      c?: {
        d: string;
      };
    }>();
    expect($.props.a.flagsValue).toMatchObject({ optional: true });
    expect($.props.b.flagsValue).toMatchObject({ optional: true });
    expect($.props.c.flagsValue).toMatchObject({ optional: true });
  });
});
describe("object.deepNullish", () => {
  it("create deep nullish", () => {
    const $ = s.object({ a: s.string() }).deepNullish();
    expect($.options.nullable).toBeFalsy();
    expect($.props.a.options.nullable).toBeTruthy();
  });
});

describe("object.deepPartial", () => {
  it("create deep partial", () => {
    const $ = s.object({ a: s.string() }).deepPartial();
    // @ts-expect-error
    expect($.flags.optional).toBeUndefined();
    expect($.props.a.flagsValue.optional).toBeTruthy();
  });
  it("create deep partial including self", () => {
    const $ = s.object({ a: s.string() }).deepPartial(true);
    expect($.flagsValue.optional).toBeTruthy();
    expect($.props.a.flagsValue.optional).toBeTruthy();
  });
});

describe("object.pick", () => {
  it("pick", () => {
    const o = s
      .object({
        name: s.string(),
        surname: s.string(),
      })
      .pick({
        name: true,
      });
    expect(Object.keys(o.props).join()).toBe("name");
  });
  it("pick two levels", () => {
    const o = s
      .object({
        name: s.string(),
        surname: s.string(),
        location: s.object({
          address: s.string(),
          postalCode: s.number(),
        }),
      })
      .pick({
        name: true,
        location: {
          postalCode: true,
        },
      });

    expect(Object.keys(o.props).join()).toBe("name,location");
    expect(Object.keys(o.props.location.props).join()).toBe("postalCode");
  });
  it("pick recursivelly", () => {
    const o = s
      .object({
        name: s.string(),
        surname: s.string(),
        location: s.object({
          address: s.string(),
          postalCode: s.number(),
        }),
      })
      .pick({
        location: true,
      });

    expect(Object.keys(o.props).join()).toBe("location");
    expect(Object.keys(o.props.location.props).join()).toBe(
      "address,postalCode",
    );
  });
});

describe("object.omit", () => {
  it("omit", () => {
    const o = s
      .object({
        name: s.string(),
        surname: s.string(),
      })
      .omit({
        name: true,
      });
    expect(Object.keys(o.props).join()).toBe("surname");
  });
  it("omit recursivelly", () => {
    const o = s
      .object({
        name: s.string(),
        surname: s.string(),
        location: s.object({
          address: s.string(),
          postalCode: s.number(),
        }),
      })
      .omit({
        name: true,
        location: {
          postalCode: true,
        },
      });

    expect(Object.keys(o.props).join()).toBe("surname,location");
    expect(Object.keys(o.props.location.props).join()).toBe("address");
  });
});

describe("object.assign", () => {
  it("add one property", () => {
    const profile = s
      .object({ name: s.string() })
      .assign({ surname: s.string() });
    expect(profile.props.name).toBeInstanceOf(StringType);
    expect(profile.props.surname).toBeInstanceOf(StringType);
  });
  it("override one property", () => {
    const profile = s.object({ name: s.string() }).assign({ name: s.number() });
    expect(profile.props.name).toBeInstanceOf(NumberType);
  });
  it("add nested property", () => {
    const profile = s
      .object({
        name: s.string(),
        address: s.object({
          postalCode: s.number(),
          street: s.object({
            type: s.string(),
          }),
        }),
      })
      .assign({
        address: {
          street: {
            number: s.number(),
          },
        },
      });
    expect(profile.props.address.props.street.props.type).toBeInstanceOf(
      StringType,
    );
    expect(profile.props.address.props.street.props.number).toBeInstanceOf(
      NumberType,
    );
  });
  it("add new nested property", () => {
    const profile = s
      .object({
        name: s.string(),
      })
      .assign({
        address: {
          street: {
            number: s.number(),
          },
        },
      });
    expect(profile.props.address.props.street.props.number).toBeInstanceOf(
      NumberType,
    );
  });
  it("override object type", () => {
    const profile = s
      .object({
        address: s.object({
          postalCode: s.number(),
        }),
      })
      .assign({
        address: s.object({
          street: s.string(),
        }),
      });
    expect(Object.keys(profile.props.address.props)).toEqual(["street"]);
    expect(profile.props.address.props.street).toBeInstanceOf(StringType);
  });
  it("merge object types", () => {
    const profile = s
      .object({
        address: s.object({
          postalCode: s.number(),
        }),
      })
      .assign(
        {
          address: s.object({
            street: s.string(),
          }),
        },
        true,
      );
    expect(Object.keys(profile.props.address.props)).toEqual([
      "postalCode",
      "street",
    ]);
    expect(profile.props.address.props.postalCode).toBeInstanceOf(NumberType);
    expect(profile.props.address.props.street).toBeInstanceOf(StringType);
  });
  it("merge deep object types", () => {
    const profile = s
      .object({
        address: s.object({
          postalCode: s.number(),
          street: s.object({
            name: s.string(),
          }),
        }),
      })
      .assign(
        {
          address: s.object({
            street: s.object({
              number: s.number(),
            }),
          }),
        },
        true,
      );
    expect(Object.keys(profile.props.address.props.street.props)).toEqual([
      "name",
      "number",
    ]);
    expect(profile.props.address.props.street.props.name).toBeInstanceOf(
      StringType,
    );
    expect(profile.props.address.props.street.props.number).toBeInstanceOf(
      NumberType,
    );
  });
});

describe("object.prop", () => {
  const o = s.object({
    _id: s.number(),
    name: s.string(),
    address: s.object({
      id: s.number(),
    }),
  });
  it("return the prop", () => {
    expect(o.prop._id().kind).toBe("number");
    expectTypeOf(o.prop._id()).toEqualTypeOf<NumberType>();
    expect(o.prop.name().kind).toBe("string");
    expectTypeOf(o.prop.name()).toEqualTypeOf<StringType>();
  });
  it("return nested prop", () => {
    expect(o.prop.address.id().kind).toBe("number");
    expectTypeOf(o.prop.address.id()).toEqualTypeOf<NumberType>();
  });
});

describe("object.refine", () => {
  it("check other value", () => {
    const o = s
      .object({
        username: s.string(),
        password: s.string(),
        confirmPassword: s.string(),
      })
      .refine((input) => {
        const path = o.prop.confirmPassword().path();
        if (input.password !== input.confirmPassword)
          return [{ path, code: "invalid" }];
        return true;
      });
    expect(
      o.validate({
        username: "a",
        password: "b",
        confirmPassword: "c",
      }),
    ).toMatchObject([
      {
        path: o.prop.confirmPassword().path(),
        code: "invalid",
      },
    ]);
    expect(
      o.validate({
        username: "a",
        password: "b",
        confirmPassword: "b",
      }),
    ).toMatchObject([]);
  });

  it("execute if no errors", () => {
    let executed = false;
    const o = s
      .object({
        a: s.string(),
        b: s.string(),
      })
      .refine(() => {
        executed = true;
        return true;
      });

    expect(o.test({ a: "a", b: "b" })).toBe(true);
    expect(executed).toBe(true);
    executed = false;
    expect(o.test({ a: "a", b: 2 })).toBe(false);
    expect(executed).toBe(false);
  });
});
