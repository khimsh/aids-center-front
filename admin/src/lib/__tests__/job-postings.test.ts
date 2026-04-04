import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiGetMock, apiPutMock, apiDeleteMock } = vi.hoisted(() => ({
  apiGetMock: vi.fn(),
  apiPutMock: vi.fn(),
  apiDeleteMock: vi.fn(),
}));

vi.mock('../api', () => ({
  api: {
    get: apiGetMock,
    put: apiPutMock,
    delete: apiDeleteMock,
  },
}));

import {
  deleteJobPosting,
  fetchJobPostingById,
  fetchJobPostings,
  publishJobPostingDraft,
  toJobCard,
  updateJobPosting,
  type JobOut,
} from '../job-postings';

describe('job postings service', () => {
  const item: JobOut = {
    id: 1,
    title_ka: 'Title',
    title_en: null,
    description_ka: 'Desc',
    description_en: null,
    department_ka: 'Dept',
    department_en: null,
    deadline: '2026-01-01T00:00:00.000Z',
    published: false,
    updated_at: '2026-01-02T00:00:00.000Z',
  };

  beforeEach(() => {
    apiGetMock.mockReset();
    apiPutMock.mockReset();
    apiDeleteMock.mockReset();
  });

  it('maps API model into card model', () => {
    const card = toJobCard(item);
    expect(card.id).toBe(1);
    expect(card.title).toBe('Title');
    expect(card.status).toBe('draft');
  });

  it('fetches list and maps to cards', async () => {
    apiGetMock.mockResolvedValue({ data: [item] });
    const result = await fetchJobPostings();
    expect(apiGetMock).toHaveBeenCalledWith('/api/job-postings');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Title');
  });

  it('fetches posting by id', async () => {
    apiGetMock.mockResolvedValue({ data: item });
    await expect(fetchJobPostingById(1)).resolves.toEqual(item);
    expect(apiGetMock).toHaveBeenCalledWith('/api/job-postings/1');
  });

  it('updates posting with normalized payload', async () => {
    apiPutMock.mockResolvedValue({ data: item });

    await updateJobPosting(1, {
      titleKa: '  KA ',
      titleEn: '  EN ',
      departmentKa: ' Dep ',
      departmentEn: '',
      descriptionKa: ' Desc ',
      descriptionEn: '',
      deadline: '2026-01-15',
      status: 'published',
    });

    expect(apiPutMock).toHaveBeenCalledWith(
      '/api/job-postings/1',
      expect.objectContaining({
        title_ka: 'KA',
        title_en: 'EN',
        department_ka: 'Dep',
        department_en: null,
        description_ka: 'Desc',
        description_en: null,
        published: true,
      }),
    );
  });

  it('publishes draft and deletes posting', async () => {
    apiPutMock.mockResolvedValue({ data: item });
    apiDeleteMock.mockResolvedValue(undefined);

    await publishJobPostingDraft(9);
    await deleteJobPosting(9);

    expect(apiPutMock).toHaveBeenCalledWith(
      '/api/job-postings/9',
      expect.objectContaining({ published: true }),
    );
    expect(apiDeleteMock).toHaveBeenCalledWith('/api/job-postings/9');
  });
});
