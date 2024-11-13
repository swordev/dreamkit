export function capitalize(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

export function uncapitalize(value: string) {
  return value.slice(0, 1).toLowerCase() + value.slice(1);
}
