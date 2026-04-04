import { useState } from 'react';
import { toast } from 'react-toastify';
import { Button, ButtonLink } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { api } from '../../lib/api';
import './job-postings-page.scss';

export function JobPostingCreatePage() {
  const [titleKa, setTitleKa] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [departmentKa, setDepartmentKa] = useState('');
  const [departmentEn, setDepartmentEn] = useState('');
  const [descriptionKa, setDescriptionKa] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [deadline, setDeadline] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearForm = () => {
    setTitleKa('');
    setTitleEn('');
    setDepartmentKa('');
    setDepartmentEn('');
    setDescriptionKa('');
    setDescriptionEn('');
    setDeadline('');
  };

  const createJob = async (status: 'draft' | 'published') => {
    if (!titleKa.trim()) {
      const message = 'სათაური (ქართულად) აუცილებელია.';
      setError(message);
      toast.error(message);
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title_ka: titleKa.trim(),
        title_en: titleEn.trim() || null,
        description_ka: descriptionKa.trim() || null,
        description_en: descriptionEn.trim() || null,
        department_ka: departmentKa.trim() || null,
        department_en: departmentEn.trim() || null,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        published: status === 'published',
        published_at: status === 'published' ? new Date().toISOString() : null
      };

      await api.post('/api/job-postings', payload);
      setError(null);
      toast.success(status === 'published' ? 'ვაკანსია წარმატებით გამოქვეყნდა.' : 'ვაკანსია დრაფტად შეინახა.');
      clearForm();
    } catch {
      const message = 'ვაკანსიის შენახვა ვერ მოხერხდა. შეამოწმეთ ველები და ავტორიზაცია.';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="jobs-page">
      <div className="jobs-header">
        <h1>ახალი ვაკანსიის დამატება</h1>
        <p className="hint">შეავსეთ ფორმა და შეინახეთ დრაფტად ან გამოაქვეყნეთ.</p>
        <div className="jobs-actions">
          <ButtonLink to="/job-postings/list" variant="secondary">ვაკანსიების სია</ButtonLink>
        </div>
      </div>

      <div className="jobs-editor">
        <div className="field-row">
          <label>
            სათაური (KA)
            <Input value={titleKa} onChange={(event) => setTitleKa(event.target.value)} required />
          </label>

          <label>
            სათაური (EN)
            <Input value={titleEn} onChange={(event) => setTitleEn(event.target.value)} />
          </label>
        </div>

        <div className="field-row">
          <label>
            დეპარტამენტი (KA)
            <Input value={departmentKa} onChange={(event) => setDepartmentKa(event.target.value)} />
          </label>

          <label>
            დეპარტამენტი (EN)
            <Input value={departmentEn} onChange={(event) => setDepartmentEn(event.target.value)} />
          </label>
        </div>

        <div className="field-row">
          <label>
            აღწერა (KA)
            <textarea value={descriptionKa} onChange={(event) => setDescriptionKa(event.target.value)} rows={4} />
          </label>

          <label>
            აღწერა (EN)
            <textarea value={descriptionEn} onChange={(event) => setDescriptionEn(event.target.value)} rows={4} />
          </label>
        </div>

        <label className="field-single">
          ვადა
          <Input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
        </label>

        {error ? <p className="error">{error}</p> : null}

        <div className="jobs-actions">
          <Button type="button" variant="secondary" onClick={() => void createJob('draft')} disabled={saving}>
            დრაფტად შენახვა
          </Button>
          <Button type="button" onClick={() => void createJob('published')} disabled={saving}>
            გამოქვეყნება
          </Button>
        </div>
      </div>
    </div>
  );
}
