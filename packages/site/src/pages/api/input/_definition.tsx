import type { JSXElement, ComponentProps } from "solid-js";

type OverrideProps<T, U> = Omit<T, keyof U> & U;

declare module "dreamkit/definitions" {
  function Input(
    props: OverrideProps<
      ComponentProps<"input">,
      {
        type: string;
        value?: any | (() => any);
        defaultValue?: any;
        onChange?: (value: any) => void;
        onNativeChange?: ComponentProps<"input">["onChange"];
      }
    >,
  ): JSXElement;
}
