import { $serializer } from "../objects/$serializer.js";

export const errorSerializer = $serializer.create({
  key: "Error",
  priority: -1,
  is: (input) => input instanceof Error,
  to: (input) => ({ name: input.name, message: input.message }),
  from: (input) => {
    const error = new Error(input.message);
    error.name = input.name;
    return error;
  },
});

export const dateSerializer = $serializer.create({
  key: "Date",
  priority: -1,
  is: (input) => input instanceof Date,
  to: (input) => input.toISOString(),
  from: (input) => new Date(input),
});
