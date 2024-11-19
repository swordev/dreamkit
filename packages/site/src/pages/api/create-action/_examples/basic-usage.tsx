// title: Basic usage
import { $api, $route, createAction } from "dreamkit";

export const start = $api.title("Start").create(async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const id = Date.now();
  if (id % 2) throw new Error("Random error");
  return id;
});

export default $route
  .path("/")
  .api({ start })
  .create(({ api }) => {
    const start = createAction(api.start);
    return (
      <>
        <ul>
          <li>state: {start.state}</li>
          <li>result: {start.result}</li>
          <li>error: {start.error?.message}</li>
        </ul>
        <button
          onClick={start}
          disabled={start.running}
          children={start.title}
        />
        <button
          onClick={start.abort}
          disabled={!start.running}
          children="abort"
        />
      </>
    );
  });
