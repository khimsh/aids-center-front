import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiGetMock, apiPostMock, apiPutMock, apiDeleteMock, apiPatchMock } = vi.hoisted(() => ({
  apiGetMock: vi.fn(),
  apiPostMock: vi.fn(),
  apiPutMock: vi.fn(),
  apiDeleteMock: vi.fn(),
  apiPatchMock: vi.fn()
}));

vi.mock('../api', () => ({
  api: {
    get: apiGetMock,
    post: apiPostMock,
    put: apiPutMock,
    delete: apiDeleteMock,
    patch: apiPatchMock
  }
}));

import {
  createDoctorTranslation,
  createDoctor,
  deleteDoctor,
  fetchDoctorById,
  fetchDoctorTranslations,
  fetchDoctors,
  reorderDoctorsByIds,
  updateDoctorTranslation,
  updateDoctor,
  type DoctorRecord
} from '../doctors';

describe('doctors service', () => {
  const doctor: DoctorRecord = {
    id: 7,
    name: 'Doctor Name',
    education: 'Education',
    experience: 'Experience',
    sort_order: 2
  };

  beforeEach(() => {
    apiGetMock.mockReset();
    apiPostMock.mockReset();
    apiPutMock.mockReset();
    apiDeleteMock.mockReset();
    apiPatchMock.mockReset();
  });

  it('fetches doctors list', async () => {
    apiGetMock.mockResolvedValue({ data: [doctor] });

    await expect(fetchDoctors()).resolves.toEqual([doctor]);
    expect(apiGetMock).toHaveBeenCalledWith('/api/doctors');
  });

  it('fetches one doctor by id', async () => {
    apiGetMock.mockResolvedValue({ data: doctor });

    await expect(fetchDoctorById(doctor.id)).resolves.toEqual(doctor);
    expect(apiGetMock).toHaveBeenCalledWith('/api/doctors/7');
  });

  it('creates and updates doctor with normalized payload', async () => {
    apiPostMock.mockResolvedValue({ data: doctor });
    apiPutMock.mockResolvedValue({ data: doctor });

    const payload = {
      name: ' Doctor Name ',
      education: ' Education ',
      experience: ' Experience ',
      department: '',
      sort_order: 5
    };

    await createDoctor(payload);
    await updateDoctor(doctor.id, payload);

    expect(apiPostMock).toHaveBeenCalledWith('/api/doctors', expect.objectContaining({
      name: 'Doctor Name',
      education: 'Education',
      experience: 'Experience',
      department: null,
      sort_order: 5
    }));

    expect(apiPutMock).toHaveBeenCalledWith('/api/doctors/7', expect.objectContaining({
      name: 'Doctor Name',
      education: 'Education',
      experience: 'Experience'
    }));
  });

  it('deletes and reorders doctors', async () => {
    apiDeleteMock.mockResolvedValue(undefined);
    apiPatchMock.mockResolvedValue({ data: [doctor] });

    await deleteDoctor(doctor.id);
    await expect(reorderDoctorsByIds([7, 4, 1])).resolves.toEqual([doctor]);

    expect(apiDeleteMock).toHaveBeenCalledWith('/api/doctors/7');
    expect(apiPatchMock).toHaveBeenCalledWith('/api/doctors/reorder-by-ids', { ids: [7, 4, 1] });
  });

  it('manages doctor translations', async () => {
    const translation = {
      id: 10,
      doctor_id: 7,
      lang: 'en',
      name: 'Doctor Name EN',
      education: 'Education EN',
      experience: 'Experience EN'
    };

    apiGetMock.mockResolvedValue({ data: [translation] });
    apiPostMock.mockResolvedValue({ data: translation });
    apiPutMock.mockResolvedValue({ data: translation });

    await expect(fetchDoctorTranslations(7)).resolves.toEqual([translation]);
    await expect(
      createDoctorTranslation(7, {
        lang: 'en',
        name: ' Doctor Name EN ',
        education: ' Education EN ',
        experience: ' Experience EN '
      })
    ).resolves.toEqual(translation);
    await expect(
      updateDoctorTranslation(7, 'en', {
        name: ' Doctor Name EN ',
        education: ' Education EN ',
        experience: ' Experience EN '
      })
    ).resolves.toEqual(translation);

    expect(apiGetMock).toHaveBeenCalledWith('/api/doctors/7/translations');
    expect(apiPostMock).toHaveBeenCalledWith('/api/doctors/7/translations', expect.objectContaining({
      lang: 'en',
      name: 'Doctor Name EN',
      education: 'Education EN',
      experience: 'Experience EN'
    }));
    expect(apiPutMock).toHaveBeenCalledWith('/api/doctors/7/translations/en', expect.objectContaining({
      name: 'Doctor Name EN',
      education: 'Education EN',
      experience: 'Experience EN'
    }));
  });
});
