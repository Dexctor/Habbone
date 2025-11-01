export type HttpErrorLike = {
  status?: number;
  code?: string;
  message?: string;
};

export function resolveHttpError(
  error: unknown,
  fallbackMessage: string,
  fallbackStatus = 500
): { message: string; status: number; code?: string } {
  if (error && typeof error === 'object') {
    const statusValue = (error as HttpErrorLike).status;
    const messageValue =
      error instanceof Error
        ? error.message || fallbackMessage
        : typeof (error as HttpErrorLike).message === 'string'
          ? (error as HttpErrorLike).message
          : fallbackMessage;
    const codeValue =
      typeof (error as HttpErrorLike).code === 'string'
        ? (error as HttpErrorLike).code
        : undefined;
    return {
      message: messageValue ?? fallbackMessage,
      status: typeof statusValue === 'number' && Number.isFinite(statusValue) ? statusValue : fallbackStatus,
      code: codeValue,
    };
  }

  return { message: fallbackMessage, status: fallbackStatus };
}

