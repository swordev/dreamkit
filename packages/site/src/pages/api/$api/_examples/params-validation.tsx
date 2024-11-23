// title: Params validation
import { $api, $route, createAction, Input, s } from "dreamkit";
import { createSignal } from "solid-js";

export const send = $api
  .title("Send")
  .params({
    name: s.string().min(1),
  })
  .create(function ({ name }) {
    console.log("Received", { name });
  });

export default $route
  .api({ send })
  .path("/")
  .create(({ api }) => {
    const [name, setName] = createSignal("");
    const send = createAction(api.send).with({
      get name() {
        return name();
      },
    });

    return (
      <>
        <Input value={name} onChange={setName} />{" "}
        <button onClick={send} disabled={send.running} children={send.title} />
        {send.error && <p>Error: {send.error.message}</p>}
        {send.state === "success" && <p>Success</p>}
      </>
    );
  });
