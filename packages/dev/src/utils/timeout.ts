export function createDelayedFunction<T extends (...args: any[]) => any>(
  func: T,
  delay = 0,
  onError?: (error: Error) => void,
) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
      try {
        await func(...args);
      } catch (error) {
        onError?.(error as any);
      }
    }, delay);
  };
}
