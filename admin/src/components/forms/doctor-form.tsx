import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  createDoctorTranslation,
  createDoctor,
  fetchDoctorById,
  fetchDoctorTranslations,
  updateDoctorTranslation,
  updateDoctor,
  type DoctorMutationInput,
  type DoctorRecord,
  type DoctorTranslationMutationInput,
  type DoctorTranslationRecord
} from '../../lib/doctors';

type DoctorFormProps = {
  doctorId?: number;
  initialDoctor?: DoctorRecord;
  defaultSortOrder?: number;
  onSaved?: () => void;
};

type FormState = {
  name: string;
  picture: string;
  profile_url: string;
  specialty: string;
  degree: string;
  department: string;
  education: string;
  experience: string;
  pedagogical_experience: string;
  memberships: string;
  publications: string;
  expertise: string;
  sort_order: string;
  name_en: string;
  specialty_en: string;
  degree_en: string;
  department_en: string;
  education_en: string;
  experience_en: string;
  pedagogical_experience_en: string;
  memberships_en: string;
  publications_en: string;
  expertise_en: string;
};

function toFormState(doctor?: DoctorRecord, translationEn?: DoctorTranslationRecord): FormState {
  return {
    name: doctor?.name ?? '',
    picture: doctor?.picture ?? '',
    profile_url: doctor?.profile_url ?? '',
    specialty: doctor?.specialty ?? '',
    degree: doctor?.degree ?? '',
    department: doctor?.department ?? '',
    education: doctor?.education ?? '',
    experience: doctor?.experience ?? '',
    pedagogical_experience: doctor?.pedagogical_experience ?? '',
    memberships: doctor?.memberships ?? '',
    publications: doctor?.publications ?? '',
    expertise: doctor?.expertise ?? '',
    sort_order: doctor?.sort_order == null ? '' : String(doctor.sort_order),
    name_en: translationEn?.name ?? '',
    specialty_en: translationEn?.specialty ?? '',
    degree_en: translationEn?.degree ?? '',
    department_en: translationEn?.department ?? '',
    education_en: translationEn?.education ?? '',
    experience_en: translationEn?.experience ?? '',
    pedagogical_experience_en: translationEn?.pedagogical_experience ?? '',
    memberships_en: translationEn?.memberships ?? '',
    publications_en: translationEn?.publications ?? '',
    expertise_en: translationEn?.expertise ?? ''
  };
}

function toMutationInput(state: FormState): DoctorMutationInput {
  const sortOrderParsed = Number(state.sort_order);
  const sortOrder =
    state.sort_order.trim() === '' || Number.isNaN(sortOrderParsed)
      ? null
      : sortOrderParsed;

  return {
    name: state.name,
    picture: state.picture,
    profile_url: state.profile_url,
    specialty: state.specialty,
    degree: state.degree,
    department: state.department,
    education: state.education,
    experience: state.experience,
    pedagogical_experience: state.pedagogical_experience,
    memberships: state.memberships,
    publications: state.publications,
    expertise: state.expertise,
    sort_order: sortOrder
  };
}

function hasEnglishTranslationInput(state: FormState): boolean {
  return [
    state.name_en,
    state.specialty_en,
    state.degree_en,
    state.department_en,
    state.education_en,
    state.experience_en,
    state.pedagogical_experience_en,
    state.memberships_en,
    state.publications_en,
    state.expertise_en
  ].some((value) => value.trim().length > 0);
}

function toEnglishTranslationInput(state: FormState): DoctorTranslationMutationInput {
  return {
    lang: 'en',
    name: state.name_en,
    specialty: state.specialty_en,
    degree: state.degree_en,
    department: state.department_en,
    education: state.education_en,
    experience: state.experience_en,
    pedagogical_experience: state.pedagogical_experience_en,
    memberships: state.memberships_en,
    publications: state.publications_en,
    expertise: state.expertise_en
  };
}

export function DoctorForm({ doctorId, initialDoctor, defaultSortOrder, onSaved }: DoctorFormProps) {
  const [state, setState] = useState<FormState>(toFormState(initialDoctor));
  const [loadingDoctor, setLoadingDoctor] = useState(Boolean(doctorId && !initialDoctor));
  const [englishTranslationExists, setEnglishTranslationExists] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDoctor() {
      if (!doctorId || initialDoctor) {
        return;
      }

      setLoadingDoctor(true);

      try {
        const [doctor, translations] = await Promise.all([
          fetchDoctorById(doctorId),
          fetchDoctorTranslations(doctorId)
        ]);
        const englishTranslation = translations.find((entry) => entry.lang.toLowerCase() === 'en');

        if (!cancelled) {
          setState(toFormState(doctor, englishTranslation));
          setEnglishTranslationExists(Boolean(englishTranslation));
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError('ექიმის მონაცემების ჩატვირთვა ვერ მოხერხდა.');
        }
      } finally {
        if (!cancelled) {
          setLoadingDoctor(false);
        }
      }
    }

    void loadDoctor();

    return () => {
      cancelled = true;
    };
  }, [doctorId, initialDoctor]);

  useEffect(() => {
    if (doctorId || initialDoctor || defaultSortOrder == null) {
      return;
    }

    setState((prev) => ({
      ...prev,
      sort_order: prev.sort_order.trim() ? prev.sort_order : String(defaultSortOrder)
    }));
  }, [doctorId, initialDoctor, defaultSortOrder]);

  const updateField = (key: keyof FormState, value: string) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const saveDoctor = async () => {
    if (!state.name.trim() || !state.education.trim() || !state.experience.trim()) {
      const message = 'სახელი, განათლება და გამოცდილება აუცილებელია.';
      setError(message);
      toast.error(message);
      return;
    }

    if (
      hasEnglishTranslationInput(state) &&
      (!state.name_en.trim() || !state.education_en.trim() || !state.experience_en.trim())
    ) {
      const message = 'ინგლისური თარგმანისთვის აუცილებელია Name, Education და Experience.';
      setError(message);
      toast.error(message);
      return;
    }

    setSaving(true);

    try {
      const payload = toMutationInput(state);
      let savedDoctor: DoctorRecord;

      if (doctorId) {
        savedDoctor = await updateDoctor(doctorId, payload);
      } else {
        savedDoctor = await createDoctor(payload);
      }

      if (hasEnglishTranslationInput(state)) {
        const translationInput = toEnglishTranslationInput(state);

        if (englishTranslationExists) {
          await updateDoctorTranslation(savedDoctor.id, 'en', {
            name: translationInput.name,
            specialty: translationInput.specialty,
            degree: translationInput.degree,
            department: translationInput.department,
            education: translationInput.education,
            experience: translationInput.experience,
            pedagogical_experience: translationInput.pedagogical_experience,
            memberships: translationInput.memberships,
            publications: translationInput.publications,
            expertise: translationInput.expertise
          });
        } else {
          await createDoctorTranslation(savedDoctor.id, translationInput);
          setEnglishTranslationExists(true);
        }
      }

      setError(null);
      toast.success(doctorId ? 'ექიმი განახლდა.' : 'ექიმი დაემატა.');
      onSaved?.();

      if (!doctorId) {
        setState({
          ...toFormState(),
          sort_order: defaultSortOrder == null ? '' : String(defaultSortOrder)
        });
        setEnglishTranslationExists(false);
      }
    } catch {
      const message = doctorId
        ? 'ექიმის განახლება ვერ მოხერხდა.'
        : 'ექიმის დამატება ვერ მოხერხდა.';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loadingDoctor) {
    return <p className="hint">იტვირთება...</p>;
  }

  return (
    <div className="posts-editor">
      <div className="field-row">
        <label>
          სახელი
          <Input value={state.name} onChange={(event) => updateField('name', event.target.value)} required />
        </label>

        <label>
          სპეციალიზაცია
          <Input value={state.specialty} onChange={(event) => updateField('specialty', event.target.value)} />
        </label>
      </div>

      <div className="field-row">
        <label>
          ხარისხი
          <Input value={state.degree} onChange={(event) => updateField('degree', event.target.value)} />
        </label>

        <label>
          დეპარტამენტი
          <Input value={state.department} onChange={(event) => updateField('department', event.target.value)} />
        </label>
      </div>

      <div className="field-row">
        <label>
          სურათის URL
          <Input value={state.picture} onChange={(event) => updateField('picture', event.target.value)} />
        </label>

        <label>
          პროფილის URL
          <Input value={state.profile_url} onChange={(event) => updateField('profile_url', event.target.value)} />
        </label>
      </div>

      <div className="field-row">
        <label>
          განათლება
          <textarea
            rows={4}
            value={state.education}
            onChange={(event) => updateField('education', event.target.value)}
            required
          />
        </label>

        <label>
          გამოცდილება
          <textarea
            rows={4}
            value={state.experience}
            onChange={(event) => updateField('experience', event.target.value)}
            required
          />
        </label>
      </div>

      <div className="field-row">
        <label>
          პედაგოგიური გამოცდილება
          <textarea
            rows={3}
            value={state.pedagogical_experience}
            onChange={(event) => updateField('pedagogical_experience', event.target.value)}
          />
        </label>

        <label>
          წევრობები
          <textarea
            rows={3}
            value={state.memberships}
            onChange={(event) => updateField('memberships', event.target.value)}
          />
        </label>
      </div>

      <div className="field-row">
        <label>
          პუბლიკაციები
          <textarea
            rows={3}
            value={state.publications}
            onChange={(event) => updateField('publications', event.target.value)}
          />
        </label>

        <label>
          ექსპერტიზა
          <textarea
            rows={3}
            value={state.expertise}
            onChange={(event) => updateField('expertise', event.target.value)}
          />
        </label>
      </div>

      <h2 style={{ margin: '0.5rem 0 0' }}>ინგლისური თარგმანი (არასავალდებულო)</h2>

      <div className="field-row">
        <label>
          Name (EN)
          <Input value={state.name_en} onChange={(event) => updateField('name_en', event.target.value)} />
        </label>

        <label>
          Specialty (EN)
          <Input
            value={state.specialty_en}
            onChange={(event) => updateField('specialty_en', event.target.value)}
          />
        </label>
      </div>

      <div className="field-row">
        <label>
          Degree (EN)
          <Input value={state.degree_en} onChange={(event) => updateField('degree_en', event.target.value)} />
        </label>

        <label>
          Department (EN)
          <Input
            value={state.department_en}
            onChange={(event) => updateField('department_en', event.target.value)}
          />
        </label>
      </div>

      <div className="field-row">
        <label>
          Education (EN)
          <textarea
            rows={4}
            value={state.education_en}
            onChange={(event) => updateField('education_en', event.target.value)}
          />
        </label>

        <label>
          Experience (EN)
          <textarea
            rows={4}
            value={state.experience_en}
            onChange={(event) => updateField('experience_en', event.target.value)}
          />
        </label>
      </div>

      <div className="field-row">
        <label>
          Pedagogical Experience (EN)
          <textarea
            rows={3}
            value={state.pedagogical_experience_en}
            onChange={(event) => updateField('pedagogical_experience_en', event.target.value)}
          />
        </label>

        <label>
          Memberships (EN)
          <textarea
            rows={3}
            value={state.memberships_en}
            onChange={(event) => updateField('memberships_en', event.target.value)}
          />
        </label>
      </div>

      <div className="field-row">
        <label>
          Publications (EN)
          <textarea
            rows={3}
            value={state.publications_en}
            onChange={(event) => updateField('publications_en', event.target.value)}
          />
        </label>

        <label>
          Expertise (EN)
          <textarea
            rows={3}
            value={state.expertise_en}
            onChange={(event) => updateField('expertise_en', event.target.value)}
          />
        </label>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <div className="posts-actions">
        <Button type="button" onClick={() => void saveDoctor()} disabled={saving}>
          {doctorId ? 'ცვლილებების შენახვა' : 'ექიმის დამატება'}
        </Button>
      </div>
    </div>
  );
}
