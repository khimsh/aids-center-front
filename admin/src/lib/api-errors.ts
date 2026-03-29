type ApiValidationIssue = {
  loc?: Array<string | number>;
  msg?: string;
};

type ApiErrorBody = {
  detail?: string | ApiValidationIssue[];
  message?: string;
};

type ApiErrorShape = {
  response?: {
    status?: number;
    data?: ApiErrorBody;
  };
  message?: string;
};

export function extractApiErrorMessage(error: unknown, fallback: string): string {
  const apiError = error as ApiErrorShape;
  const status = apiError.response?.status;
  const data = apiError.response?.data;

  if (typeof data?.detail === 'string' && data.detail.trim()) {
    return status ? `${status}: ${data.detail}` : data.detail;
  }

  if (Array.isArray(data?.detail) && data.detail.length > 0) {
    const first = data.detail[0];
    const loc = Array.isArray(first.loc) ? first.loc.join('.') : 'field';
    const msg = first.msg ?? 'Validation error';
    return status ? `${status}: ${loc} - ${msg}` : `${loc} - ${msg}`;
  }

  if (typeof data?.message === 'string' && data.message.trim()) {
    return status ? `${status}: ${data.message}` : data.message;
  }

  if (typeof apiError.message === 'string' && apiError.message.trim()) {
    return apiError.message;
  }

  return fallback;
}