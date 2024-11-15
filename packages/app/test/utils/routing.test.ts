import {
  createRoutePathRegex,
  createRouteUrl,
  extractPathParams,
} from "../../src/utils/routing.js";
import { describe, it, expect } from "vitest";

describe("extractPathParams", () => {
  it("extract optional param", () => {
    expect(extractPathParams("/users/:id?")).toMatchObject([
      {
        key: ":id?",
        name: "id",
        optional: true,
        spread: false,
      },
    ]);
  });
});

describe("createRouteUrl", () => {
  it("with optional param", () => {
    expect(createRouteUrl("/users/:id?", { id: 1 }).pathname).toBe("/users/1");
    expect(createRouteUrl("/users/:id?").pathname).toBe("/users");
  });
});

describe("createRoutePathRegex", () => {
  it("with optional param", () => {
    const regex = createRoutePathRegex("/users/:id?");
    expect(regex.test("/users")).toBe(true);
    expect(regex.test("/users/")).toBe(true);
    expect(regex.test("/users/1")).toBe(true);
    expect(regex.test("/users/1/")).toBe(true);
    expect(regex.test("/users/1/2")).toBe(false);
  });
  it("with required param", () => {
    const regex = createRoutePathRegex("/users/:id");
    expect(regex.test("/users")).toBe(false);
    expect(regex.test("/users/")).toBe(false);
    expect(regex.test("/users/1")).toBe(true);
    expect(regex.test("/users/1/")).toBe(true);
    expect(regex.test("/users/1/2")).toBe(false);
  });
  it("with spread", () => {
    const regex = createRoutePathRegex("/users/*any");
    expect(regex.test("/")).toBe(false);
    expect(regex.test("/users")).toBe(true);
    expect(regex.test("/users/")).toBe(true);
    expect(regex.test("/users/1")).toBe(true);
    expect(regex.test("/users/1/")).toBe(true);
    expect(regex.test("/users/1/2")).toBe(true);
  });
  it("with all", () => {
    const regex = createRoutePathRegex("/*any");
    expect(regex.test("/")).toBe(true);
    expect(regex.test("/users")).toBe(true);
    expect(regex.test("/users/")).toBe(true);
    expect(regex.test("/users/1")).toBe(true);
    expect(regex.test("/users/1/")).toBe(true);
    expect(regex.test("/users/1/2")).toBe(true);
  });
});
