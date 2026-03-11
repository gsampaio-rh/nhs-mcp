import { logger } from "../../infrastructure/logger.js";

export function withErrorHandling<T, R>(
  toolName: string,
  handler: (args: T) => Promise<R>,
): (args: T) => Promise<R> {
  return async (args: T) => {
    try {
      return await handler(args);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      logger.error(`Unhandled error in tool ${toolName}`, { error: message });
      return {
        content: [{ type: "text" as const, text: `Internal error in ${toolName}: ${message}` }],
        isError: true,
      } as R;
    }
  };
}
