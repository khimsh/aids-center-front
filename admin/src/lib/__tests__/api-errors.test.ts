import { describe, expect, it } from 'vitest';
import { extractApiErrorMessage } from '../api-errors';

describe('extractApiErrorMessage', () => {
  const fallback = 'fallback message';

  it('returns detail string when present', () => {
    const message = extractApiErrorMessage(
      { response: { status: 400, data: { detail: 'Bad request' } } },
      fallback
    );

    expect(message).toBe('400: Bad request');
  });

  it('returns validation issue detail array message', () => {
    const message = extractApiErrorMessage(
      {
        response: {
          status: 422,
          data: {
            detail: [{ loc: ['body', 'email'], msg: 'invalid email' }]
          }
        }
      },
      fallback
    );

    expect(message).toBe('422: body.email - invalid email');
  });

  it('returns response message when present', () => {
    const message = extractApiErrorMessage(
      { response: { status: 500, data: { message: 'Server down' } } },
      fallback
    );

    expect(message).toBe('500: Server down');
  });

  it('falls back to generic error message', () => {
    const message = extractApiErrorMessage({ message: 'Network Error' }, fallback);
    expect(message).toBe('Network Error');
  });

  it('returns fallback when no recognized shape is present', () => {
    const message = extractApiErrorMessage({}, fallback);
    expect(message).toBe(fallback);
  });
});
