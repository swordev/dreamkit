export const kindTag = "__kind";

type KindObject = {
  [kindTag]: string | string[] | undefined;
};

type AnyConstructor =
  | (abstract new (...args: any[]) => any)
  | (new (...args: any[]) => any);

export function kind(input: object, name: string) {
  const $input = input as KindObject;
  const value = $input[kindTag];
  if (Array.isArray(value)) {
    value.push(name);
  } else if (typeof value === "string") {
    $input[kindTag] = [value, name];
  } else {
    $input[kindTag] = name;
  }
}

/*#__NO_SIDE_EFFECTS__*/
export function createIsKind<T>(
  namespace: string,
): (input: unknown) => input is T {
  const result = (input: unknown) => is(input, namespace);
  return result as any;
}

export function getKinds(input: unknown): string[] {
  const tags = [];
  let current = input;
  while (current && current !== Function.prototype) {
    if (current.hasOwnProperty?.(kindTag)) {
      const tagValue = (current as any)[kindTag];
      if (Array.isArray(tagValue)) {
        tags.unshift(...tagValue);
      } else if (typeof tagValue === "string") {
        tags.unshift(tagValue);
      }
    }
    current = Object.getPrototypeOf(current);
  }

  return tags;
}

export function getKind(input: unknown): string | undefined {
  return getKinds(input)?.at(-1);
}

export function hasKinds(input: unknown): input is KindObject {
  return !!getKinds(input)?.length;
}

export function compareKinds(subject: unknown, pattern: unknown) {
  const subjectKinds = getKinds(subject);
  const patternKind = typeof pattern === "string" ? pattern : getKind(pattern);
  return subjectKinds && patternKind
    ? subjectKinds.includes(patternKind)
    : false;
}

export function kindOf<T extends AnyConstructor>(
  subject: any,
  pattern: T,
): subject is InstanceType<T> {
  return (
    !!subject &&
    (subject instanceof pattern || compareKinds(subject?.constructor, pattern))
  );
}

export function assertKindOf<T extends AnyConstructor>(
  subject: any,
  pattern: T,
): asserts subject is InstanceType<T> {
  if (!kindOf(subject, pattern))
    throw new Error(
      `Object is not ${pattern.name}: ${subject.constructor?.name}`,
    );
}

export function is(subject: any, pattern: string): boolean;
export function is<T extends AnyConstructor>(
  subject: any,
  pattern: T,
): subject is T;
export function is(subject: any, pattern: any) {
  if (typeof pattern === "string") {
    return !!subject && compareKinds(subject, pattern);
  } else {
    return !!subject && (subject === pattern || compareKinds(subject, pattern));
  }
}
