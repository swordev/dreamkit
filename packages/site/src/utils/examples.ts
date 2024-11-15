export interface ExampleProps {
  title?: string;
  code: string | { default: string };
  playground?: boolean;
  pkgDependencies?: Record<string, string>;
  pkgDevDependencies?: Record<string, string>;
}

export const getExampleId = (title: string) => {
  return `example_${title.toLowerCase().replaceAll(" ", "_")}`;
};

export const parseExample = (example: ExampleProps, index: number) => {
  let params: { title?: string; fileName?: string } = {};
  const code =
    typeof example.code === "string" ? example.code : example.code.default;
  const lines = code.split("\n").filter((line, index) => {
    if (!index && line.startsWith("//")) {
      const [inKey, ...values] = line.slice(2).split(":");
      const key = inKey.trim();
      const value = values.join(":").trim();
      (params as any)[key] = value;
      return false;
    } else if (line.trim() === "// @ts-nocheck") {
      return false;
    } else if (line.trim() === "// @ts-expect-error") {
      return false;
    } else if (line.trim() === "{/* @ts-expect-error */}") {
      return false;
    } else {
      return true;
    }
  });
  const title = example.title ?? params.title ?? `Example ${index + 1}`;
  return {
    ...example,
    code: lines.join("\n"),
    title,
    id: getExampleId(title),
  };
};

export function normalizeExample(
  input: ExampleProps | { default: string },
  index: number = 0,
) {
  const example = "default" in input ? { code: input.default } : input;
  return parseExample(example, index);
}
