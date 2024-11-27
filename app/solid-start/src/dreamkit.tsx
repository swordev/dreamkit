import { $api, $route, createAction, Input, s } from "dreamkit";

const send = $api
  .title("Send")
  .params({
    name: s.string().min(1),
  })
  .create(function ({ name }) {
    console.log("Received", { name });
  });

export default $route
  .api({ send })
  .params(s.object(send.params).deepPartial())
  .path("/")
  .create(({ api, params, setParams }) => {
    const send = createAction(api.send).with({
      get name() {
        return params.name || "";
      },
    });
    return (
      <>
        <Input
          value={params.name || ""}
          onChange={(name) => setParams({ name: name || undefined })}
        />{" "}
        <button onClick={send} disabled={send.running} children={send.title} />
        {send.error && <p>Error: {send.error.message}</p>}
        {send.state === "success" && <p>Success</p>}
      </>
    );
  });
