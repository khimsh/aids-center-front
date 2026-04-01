import { api } from './api';

export type DoctorRecord = {
  id: number;
  name: string;
  picture?: string | null;
  profile_url?: string | null;
  specialty?: string | null;
  degree?: string | null;
  department?: string | null;
  education: string;
  experience: string;
  pedagogical_experience?: string | null;
  memberships?: string | null;
  publications?: string | null;
  expertise?: string | null;
  sort_order?: number | null;
  created_at?: string;
  updated_at?: string;
};

export type DoctorTranslationRecord = {
  id: number;
  doctor_id: number;
  lang: string;
  name: string;
  specialty?: string | null;
  degree?: string | null;
  department?: string | null;
  education: string;
  experience: string;
  pedagogical_experience?: string | null;
  memberships?: string | null;
  publications?: string | null;
  expertise?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type DoctorMutationInput = {
  name: string;
  picture?: string;
  profile_url?: string;
  specialty?: string;
  degree?: string;
  department?: string;
  education: string;
  experience: string;
  pedagogical_experience?: string;
  memberships?: string;
  publications?: string;
  expertise?: string;
  sort_order?: number | null;
};

export type DoctorTranslationMutationInput = {
  lang: string;
  name: string;
  specialty?: string;
  degree?: string;
  department?: string;
  education: string;
  experience: string;
  pedagogical_experience?: string;
  memberships?: string;
  publications?: string;
  expertise?: string;
};

function asNullable(value?: string): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toDoctorPayload(input: DoctorMutationInput) {
  return {
    name: input.name.trim(),
    picture: asNullable(input.picture),
    profile_url: asNullable(input.profile_url),
    specialty: asNullable(input.specialty),
    degree: asNullable(input.degree),
    department: asNullable(input.department),
    education: input.education.trim(),
    experience: input.experience.trim(),
    pedagogical_experience: asNullable(input.pedagogical_experience),
    memberships: asNullable(input.memberships),
    publications: asNullable(input.publications),
    expertise: asNullable(input.expertise),
    sort_order:
      typeof input.sort_order === 'number' && Number.isFinite(input.sort_order)
        ? input.sort_order
        : null
  };
}

function toDoctorTranslationPayload(input: DoctorTranslationMutationInput) {
  return {
    lang: input.lang.trim(),
    name: input.name.trim(),
    specialty: asNullable(input.specialty),
    degree: asNullable(input.degree),
    department: asNullable(input.department),
    education: input.education.trim(),
    experience: input.experience.trim(),
    pedagogical_experience: asNullable(input.pedagogical_experience),
    memberships: asNullable(input.memberships),
    publications: asNullable(input.publications),
    expertise: asNullable(input.expertise)
  };
}

export async function fetchDoctors(): Promise<DoctorRecord[]> {
  const response = await api.get('/api/doctors');
  const data = response.data as unknown;

  if (!Array.isArray(data)) {
    return [];
  }

  return data as DoctorRecord[];
}

export async function fetchDoctorById(doctorId: number): Promise<DoctorRecord> {
  const response = await api.get(`/api/doctors/${doctorId}`);
  return response.data as DoctorRecord;
}

export async function createDoctor(input: DoctorMutationInput): Promise<DoctorRecord> {
  const response = await api.post('/api/doctors', toDoctorPayload(input));
  return response.data as DoctorRecord;
}

export async function updateDoctor(doctorId: number, input: DoctorMutationInput): Promise<DoctorRecord> {
  const response = await api.put(`/api/doctors/${doctorId}`, toDoctorPayload(input));
  return response.data as DoctorRecord;
}

export async function deleteDoctor(doctorId: number): Promise<void> {
  await api.delete(`/api/doctors/${doctorId}`);
}

export async function reorderDoctorsByIds(ids: number[]): Promise<DoctorRecord[]> {
  const response = await api.patch('/api/doctors/reorder-by-ids', { ids });
  const data = response.data as unknown;
  return Array.isArray(data) ? (data as DoctorRecord[]) : [];
}

export async function fetchDoctorTranslations(doctorId: number): Promise<DoctorTranslationRecord[]> {
  const response = await api.get(`/api/doctors/${doctorId}/translations`);
  const data = response.data as unknown;
  return Array.isArray(data) ? (data as DoctorTranslationRecord[]) : [];
}

export async function createDoctorTranslation(
  doctorId: number,
  input: DoctorTranslationMutationInput
): Promise<DoctorTranslationRecord> {
  const response = await api.post(
    `/api/doctors/${doctorId}/translations`,
    toDoctorTranslationPayload(input)
  );
  return response.data as DoctorTranslationRecord;
}

export async function updateDoctorTranslation(
  doctorId: number,
  lang: string,
  input: Omit<DoctorTranslationMutationInput, 'lang'>
): Promise<DoctorTranslationRecord> {
  const response = await api.put(`/api/doctors/${doctorId}/translations/${encodeURIComponent(lang)}`, {
    name: input.name.trim(),
    specialty: asNullable(input.specialty),
    degree: asNullable(input.degree),
    department: asNullable(input.department),
    education: input.education.trim(),
    experience: input.experience.trim(),
    pedagogical_experience: asNullable(input.pedagogical_experience),
    memberships: asNullable(input.memberships),
    publications: asNullable(input.publications),
    expertise: asNullable(input.expertise)
  });

  return response.data as DoctorTranslationRecord;
}
