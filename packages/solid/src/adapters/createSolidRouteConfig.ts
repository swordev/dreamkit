import type { RouteBuilder } from "@dreamkit/app";
import type { ObjectType, Type } from "@dreamkit/schema";
import type { RouteDefinition } from "@solidjs/router";

export function createSolidRouteConfig(
  route: RouteBuilder<any>,
): RouteDefinition {
  const options = route.options;
  const def = {
    ...(options.path && {
      path: options.path,
    }),
    ...(options.params && {
      matchFilters: Object.entries((options.params as ObjectType).props).reduce(
        (filters, [name, prop]) => {
          filters[name] = (input) => {
            const casted = (prop as Type).cast(input);
            return !(prop as Type).validate(casted).length;
          };
          return filters;
        },
        {} as Record<string, (input: any) => boolean>,
      ),
    }),
  } as RouteDefinition;
  return def;
}
