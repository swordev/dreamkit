import { $serializer } from "../objects/$serializer.js";

export const dateSerializer = $serializer.create<Date, string>({
  key: "Date",
  priority: -1,
  is: (input) => input instanceof Date,
  to: (input) => input.toISOString(),
  from: (input) => new Date(input),
});
