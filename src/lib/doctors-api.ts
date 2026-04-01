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

export function getDoctorsApiBase(): string {
  return import.meta.env.PUBLIC_API_URL?.trim() || 'http://localhost:8000';
}

export function toAbsoluteImageUrl(apiBase: string, value?: string | null): string {
  const trimmed = value?.trim();

  if (!trimmed) {
    return '';
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const normalizedBase = apiBase.replace(/\/$/, '');
  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  return `${normalizedBase}${normalizedPath}`;
}

export async function fetchDoctors(apiBase: string): Promise<DoctorRecord[]> {
  const response = await fetch(`${apiBase}/api/doctors`);

  if (!response.ok) {
    throw new Error(`Doctors list fetch failed: ${response.status}`);
  }

  const payload = (await response.json()) as unknown;

  if (!Array.isArray(payload)) {
    return [];
  }

  return payload as DoctorRecord[];
}

export async function fetchDoctorById(
  apiBase: string,
  doctorId: number,
): Promise<DoctorRecord | null> {
  const response = await fetch(`${apiBase}/api/doctors/${doctorId}`);

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }

    throw new Error(`Doctor fetch failed: ${response.status}`);
  }

  const payload = (await response.json()) as unknown;

  if (!payload || Array.isArray(payload)) {
    return null;
  }

  return payload as DoctorRecord;
}

export async function fetchDoctorTranslationByLang(
  apiBase: string,
  doctorId: number,
  lang: string,
): Promise<DoctorTranslationRecord | null> {
  const response = await fetch(
    `${apiBase}/api/doctors/${doctorId}/translations/${encodeURIComponent(lang)}`,
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }

    throw new Error(`Doctor translation fetch failed: ${response.status}`);
  }

  const payload = (await response.json()) as unknown;

  if (!payload || Array.isArray(payload)) {
    return null;
  }

  return payload as DoctorTranslationRecord;
}

export function applyDoctorTranslation(
  doctor: DoctorRecord,
  translation: DoctorTranslationRecord | null,
): DoctorRecord {
  if (!translation) {
    return doctor;
  }

  return {
    ...doctor,
    name: translation.name,
    specialty: translation.specialty,
    degree: translation.degree,
    department: translation.department,
    education: translation.education,
    experience: translation.experience,
    pedagogical_experience: translation.pedagogical_experience,
    memberships: translation.memberships,
    publications: translation.publications,
    expertise: translation.expertise,
  };
}
