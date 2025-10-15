import {
  $serializer,
  dateSerializer,
  EJSON,
  errorSerializer,
} from "../src/index.js";
import { describe, expect, it } from "vitest";

describe("EJSON", () => {
  class LocalDate {
    constructor(readonly date: string) {}
  }
  const serializer = $serializer.create<LocalDate, string>({
    key: "LocalDateTime",
    is: (input) => input instanceof LocalDate,
    to: (input) => input.date,
    from: (output) => new LocalDate(output),
  });

  it("encode", () => {
    const ejson = new EJSON([serializer]);
    const encoded = ejson.encode({
      date: new LocalDate("2024-01-01"),
    });
    expect(encoded).toEqual({
      date: { $ejson: "LocalDateTime", $value: "2024-01-01" },
    });
  });

  it("decode", () => {
    const ejson = new EJSON([serializer]);
    const encoded = ejson.encode({
      date: new LocalDate("2024-01-01"),
    });
    const decoded = ejson.decode(encoded);
    expect(Object.keys(decoded)).toEqual(["date"]);
    expect(decoded.date).instanceOf(LocalDate);
    expect(decoded.date.date).toEqual("2024-01-01");
  });

  it("encode/decode error", () => {
    const ejson = new EJSON([errorSerializer]);
    const error = new Error("test");
    const encoded = ejson.encode([error]);
    expect(encoded).toEqual([
      { $ejson: "Error", $value: { name: "Error", message: error.message } },
    ]);
    const decoded = ejson.decode(encoded);
    expect(decoded).toHaveLength(1);
    expect(decoded[0]).instanceOf(Error);
    expect(decoded[0].message).toEqual(error.message);
  });

  it("encode/decode date", () => {
    const ejson = new EJSON([dateSerializer]);
    const date = new Date("2024-01-01T00:00:00Z");
    const encoded = ejson.encode([date]);
    expect(encoded).toEqual([{ $ejson: "Date", $value: date.toISOString() }]);
    const decoded = ejson.decode(encoded);
    expect(decoded).toHaveLength(1);
    expect(decoded[0]).instanceOf(Date);
    expect(decoded[0].toISOString()).toEqual(date.toISOString());
  });

  it("use priority", () => {
    class CustomError extends Error {}
    const errorSerializer = $serializer.create<Error, string>({
      key: "Error",
      is: (input) => input instanceof Error,
      to: (input) => input.message,
      from: (output) => new Error(output),
    });
    const customSerializer = $serializer.create<CustomError, string>({
      key: "CustomError",
      is: (input) => input instanceof CustomError,
      to: (input) => input.message,
      from: (output) => new CustomError(output),
    });
    expect(
      new EJSON([errorSerializer, customSerializer]).encode({
        date: new CustomError(),
      }),
    ).toEqual({
      date: { $ejson: "Error", $value: "" },
    });
    expect(
      new EJSON([
        $serializer.create({ ...errorSerializer.config, priority: -1 }),
        customSerializer,
      ]).encode({
        date: new CustomError(),
      }),
    ).toEqual({
      date: { $ejson: "CustomError", $value: "" },
    });
  });
});
