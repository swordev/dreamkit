import {
  createEffect,
  createSignal,
  createMemo,
  type Accessor,
  type Setter,
} from "solid-js";

export type ControlledValueProps<T = unknown> = {
  value?: T | (() => T | undefined) | undefined;
  defaultValue?: T | undefined;
  onChange?: (value: T) => void;
};

export type ControlledValue<T = unknown> = [
  get: Accessor<T | undefined>,
  set: Setter<T | undefined>,
  controlled: boolean,
];

export function createControlledValue<T = unknown>(
  props: ControlledValueProps<T>,
): ControlledValue<T> {
  const controlled = props.value !== undefined;
  const [valueState, setValueState] = createSignal(props.defaultValue);
  const propsValue = () =>
    typeof props.value === "function"
      ? (props.value as Function)()
      : props.value;

  const value = controlled ? createMemo(propsValue) : createMemo(valueState);

  if (controlled) {
    createEffect(() => setValueState(() => value()));
    createEffect(() => {
      if (propsValue() === undefined)
        console.error("Controlled value can not be undefined");
    });
  } else {
    createEffect(() => {
      if (propsValue() !== undefined)
        console.error("Uncontrolled value can not be defined");
    });
    createEffect((first) => {
      props.defaultValue;
      if (first) return false;
      console.error("Uncontrolled value can not change the default value");
      return false;
    }, true);
  }

  const setValue = (...args: any[]) => {
    if (!controlled) return setValueState(...(args as any));
    if (props.onChange) {
      let [newValue] = args;
      if (typeof newValue === "function") newValue = newValue();
      props.onChange(newValue);
    }
  };

  return [value, setValue, controlled];
}
