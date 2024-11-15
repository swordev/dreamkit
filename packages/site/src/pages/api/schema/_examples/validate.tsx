// title: Validate
import { $route, Input, s } from "dreamkit";
import { createSignal } from "solid-js";

const type = s.string().min(3).max(5);

export default $route.path("/").create(() => {
  const [name, setName] = createSignal("");
  return (
    <>
      <Input value={name} onChange={setName} />
      <p>
        {"errors: "}
        {JSON.stringify(type.validate(name()), null, 2)}
      </p>
    </>
  );
});
