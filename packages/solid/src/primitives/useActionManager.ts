import type { ActionResult } from "./createAction.js";
import { createContext, useContext } from "solid-js";

export type ActionManagerContextValue = {
  add: (action: ActionResult<any>) => void;
  remove: (action: ActionResult<any>) => void;
};

export const ActionManagerContext = createContext<ActionManagerContextValue>();
export const useActionManager = () => useContext(ActionManagerContext);
