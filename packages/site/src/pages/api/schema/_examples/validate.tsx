// title: Validate
import { $route, s, type InferType } from "dreamkit";

const type = s.object({
  name: s.string().min(3),
  enabled: s.bool(),
});

export default $route.path("/").create(() => {
  const value: InferType<typeof type> = {
    name: "ab",
    enabled: true,
  };
  return (
    <>
      <p>validate: {JSON.stringify(type.validate(value), null, 2)}</p>
    </>
  );
});
