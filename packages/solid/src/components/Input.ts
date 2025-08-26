import {
  ControlledValueProps,
  createControlledValue,
} from "../primitives/createControlledValue.js";
import { InputControl, InputType, InputValue } from "../utils/dom.js";
import {
  ComponentProps,
  createComponent,
  createEffect,
  JSXElement,
  mergeProps,
  on,
  splitProps,
} from "solid-js";
import { Dynamic } from "solid-js/web";

export type { InputType };

export type InputProps<T extends InputType = InputType> = Omit<
  ComponentProps<"input">,
  "value" | "onChange" | "type"
> &
  ControlledValueProps<InputValue<T>> & {
    type: T;
    onChange?: (value: InputValue<T>) => void;
    onNativeChange?: ComponentProps<"input">["onChange"];
  };

function splitInputProps<T extends InputType>(props: InputProps<T>) {
  return splitProps(props, [
    "ref",
    "value",
    "defaultValue",
    "onChange",
    "onNativeChange",
  ]);
}

export function Input(inProps: Omit<InputProps<"text">, "type">): JSXElement;
export function Input<T extends InputType>(inProps: InputProps<T>): JSXElement;
export function Input(inProps: any) {
  let control!: InputControl<InputType>;
  const [props, inputProps] = splitInputProps(inProps);

  const [value, setValue, controlled] = createControlledValue(props);
  createEffect(
    on(
      () => value(),
      (value) => control?.tryProcessValueEvent(value!),
    ),
  );
  return createComponent(
    Dynamic,
    mergeProps(
      {
        component: "input",
        ref(element: HTMLInputElement) {
          control = new InputControl<InputType>(
            (element.type ?? "text") as InputType,
            element,
            [value, setValue, controlled] as any,
            props.onChange,
          );
          if (typeof props.ref === "function") (props.ref as any)(element);
        },
        value: value(),
        onChange: props.onNativeChange,
      },
      inputProps,
    ),
  );
}
