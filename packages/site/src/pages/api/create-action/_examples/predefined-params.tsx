// title: Predefined params
import { $api, $route, createAction, Input, s } from "dreamkit";
import { createEffect, createSignal } from "solid-js";

const remove = $api
  .title("Remove")
  .params({
    key: s.title("Key").string(),
  })
  .create(({ key }) => {
    console.log("Received", { key });
  });

export default $route
  .path("/")
  .api({ remove })
  .create(({ api }) => {
    const [key, setKey] = createSignal("");
    const remove = createAction(api.remove).with(() => ({ key: key() }));
    createEffect(() => {
      if (remove.state === "success") {
        setKey("");
        remove.clear();
      }
    });
    return (
      <>
        <p>
          <Input
            placeholder={remove.params.key.options.title}
            value={key}
            onChange={setKey}
          />
        </p>
        <button
          onClick={remove}
          disabled={remove.running}
          children={remove.title}
        />
      </>
    );
  });
