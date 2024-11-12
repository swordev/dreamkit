// title: Basic usage
import { $route, createAction } from "dreamkit";

export default $route.path("/").create(() => {
  const start = createAction(
    () =>
      new Promise<number>((resolve) => {
        setTimeout(() => resolve(Date.now()), 1000);
      }),
  );
  return (
    <>
      <p>{start.result}</p>
      <button onClick={start} disabled={start.running}>
        Start
      </button>
    </>
  );
});
