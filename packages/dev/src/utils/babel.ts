import $generator from "@babel/generator";
import $parser from "@babel/parser";
import $traverse from "@babel/traverse";

export const generator: typeof $generator.default =
  typeof $generator === "function" ? $generator : $generator.default;

export const parser: typeof $parser =
  typeof $parser === "function" ? $parser : $parser;

export const traverse: typeof $traverse.default =
  typeof $traverse === "function" ? $traverse : $traverse.default;
