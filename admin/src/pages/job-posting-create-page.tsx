import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../lib/api';
import './job-postings-page.css';

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
          <Link to="/job-postings/list">
            <button type="button" className="button-secondary">ვაკანსიების სია</button>
          </Link>
        </div>
      </div>

      <div className="jobs-editor">
        <div className="field-row">
          <label>
            სათაური (KA)
            <input value={titleKa} onChange={(event) => setTitleKa(event.target.value)} required />
          </label>

          <label>
            სათაური (EN)
            <input value={titleEn} onChange={(event) => setTitleEn(event.target.value)} />
          </label>
        </div>

        <div className="field-row">
          <label>
            დეპარტამენტი (KA)
            <input value={departmentKa} onChange={(event) => setDepartmentKa(event.target.value)} />
          </label>

          <label>
            დეპარტამენტი (EN)
            <input value={departmentEn} onChange={(event) => setDepartmentEn(event.target.value)} />
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
          <input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
        </label>

        {error ? <p className="error">{error}</p> : null}

        <div className="jobs-actions">
          <button type="button" className="button-secondary" onClick={() => void createJob('draft')} disabled={saving}>
            დრაფტად შენახვა
          </button>
          <button type="button" onClick={() => void createJob('published')} disabled={saving}>
            გამოქვეყნება
          </button>
        </div>
      </div>
    </div>
  );
}
