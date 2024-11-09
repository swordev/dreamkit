import type { JSXElement, ComponentProps } from "solid-js";

type OverrideProps<T, U> = Omit<T, keyof U> & U;

export declare function Input(
  props: OverrideProps<
    ComponentProps<"input">,
    {
      type: string;
      value?: string | number | boolean;
      defaultValue?: string | number | boolean;
      onChange?: (value: string | number | boolean) => void;
      onNativeChange?: ComponentProps<"input">["onChange"];
    }
  >,
): JSXElement;
