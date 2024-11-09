import { createAction } from "dreamkit";

export default function App() {
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
}
