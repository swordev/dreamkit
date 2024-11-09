import type { ControlledValue } from "../primitives/createControlledValue.js";
import { untrack } from "solid-js/web";

const selectionTypes = new Set(["text", "search", "password", "tel", "url"]);

export type InputType =
  //| "button"
  | "checkbox"
  | "color"
  | "date"
  | "datetime-local"
  | "email"
  | "file"
  | "hidden"
  //| "image"
  | "month"
  | "number"
  | "password"
  | "radio"
  | "range"
  //| "reset"
  | "search"
  //| "submit"
  | "tel"
  | "text"
  | "time"
  | "url"
  | "week";

export type InputControlTypes = {
  number: number | null;
  file: File | null;
  checkbox: boolean;
};

export type InputValue<T extends InputType> = T extends keyof InputControlTypes
  ? InputControlTypes[T]
  : string;

export class InputControl<T extends InputType> {
  public lastSelectionStart: number | undefined;
  public valueEvent: boolean = false;
  constructor(
    readonly type: T,
    readonly input: HTMLInputElement,
    readonly controlled: ControlledValue<InputValue<T>>,
    readonly onChange?: (value: InputValue<T>) => void,
  ) {
    const [, , isControlled] = this.controlled;
    if (isControlled && this.hasControlledValueAttr())
      input.addEventListener("blur", this.processBlurEvent.bind(this));
    input.addEventListener("input", this.processInputEvent.bind(this));
  }
  hasControlledValueAttr() {
    return this.input.type === "date" || this.input.type === "number";
  }
  hasSelectionRange() {
    return (
      this.input.nodeName === "TEXTAREA" ||
      !this.input.type ||
      selectionTypes.has(this.input.type)
    );
  }
  getValue(): InputValue<T> {
    if (this.input.type === "file") {
      return (this.input.files?.item(0) ?? null) as any;
    } else if (this.input.type === "checkbox") {
      return this.input.checked as any;
    } else if (this.input.type === "number") {
      if (this.input.value === "") return null as any;
      return Number(this.input.value) as any;
    } else {
      return this.input.value as any;
    }
  }
  setValue(value: InputValue<T>, onlyIfDifferent = true) {
    if (onlyIfDifferent && value === this.getValue()) return;
    if (this.input.type === "file") {
      const dataTransfer = new DataTransfer();
      if (value) dataTransfer.items.add(value as File);
      this.input.files = dataTransfer.files;
    } else if (this.input.type === "checkbox") {
      this.input.checked = Boolean(value);
    } else {
      this.input.value = `${value ?? ""}`;
    }
  }
  processBlurEvent() {
    const [value] = this.controlled;
    this.input.setAttribute("value", `${untrack(value) ?? ""}`);
  }
  processInputEvent() {
    const [value, setValue, isControlled] = this.controlled;
    const nextValue = this.getValue();
    if (typeof nextValue === "string" && this.hasSelectionRange())
      this.lastSelectionStart = this.input.selectionStart ?? nextValue.length;
    this.valueEvent = false;
    try {
      setValue(() => nextValue);
      this.onChange?.(nextValue);
      if (isControlled && !this.valueEvent) this.setValue(untrack(value)!);
    } finally {
      this.valueEvent = false;
    }
    return nextValue;
  }
  tryProcessValueEvent(nextValue: InputValue<T>) {
    const [, , isControlled] = this.controlled;
    if (isControlled) this.processValueEvent(nextValue);
  }
  processValueEvent(nextValue: InputValue<T>) {
    this.valueEvent = true;
    if (!this.hasControlledValueAttr())
      this.input.setAttribute("value", `${nextValue}`);
    this.setValue(nextValue);
    if (typeof nextValue === "string" && this.hasSelectionRange()) {
      const selectionStart = this.lastSelectionStart ?? nextValue.length;
      if (this.input.selectionStart !== selectionStart)
        this.input.setSelectionRange(selectionStart, selectionStart);
    }
  }
}
