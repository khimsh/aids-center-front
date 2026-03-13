import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import './job-postings-page.css';

type JobCard = {
  id: number;
  title: string;
  department: string;
  description: string;
  deadline: string;
  status: 'draft' | 'published';
  updatedAt: string;
};

type JobOut = {
  id: number;
  title_ka: string;
  description_ka: string | null;
  department_ka: string | null;
  deadline: string | null;
  published: boolean;
  updated_at: string;
};

export function JobPostingsPage() {
  const [titleKa, setTitleKa] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [departmentKa, setDepartmentKa] = useState('');
  const [departmentEn, setDepartmentEn] = useState('');
  const [descriptionKa, setDescriptionKa] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [saving, setSaving] = useState(false);
  const [busyJobId, setBusyJobId] = useState<number | null>(null);

  const toCard = (job: JobOut): JobCard => ({
    id: job.id,
    title: job.title_ka,
    department: job.department_ka ?? '',
    description: job.description_ka ?? '',
    deadline: job.deadline ? new Date(job.deadline).toLocaleDateString() : 'არ არის მითითებული',
    status: job.published ? 'published' : 'draft',
    updatedAt: new Date(job.updated_at).toLocaleString()
  });

  useEffect(() => {
    const loadPublishedJobs = async () => {
      try {
        const response = await api.get('/api/job-postings');
        const items = (response.data ?? []) as Array<{
          id: number;
          title_ka: string;
          department_ka: string | null;
          description_ka: string | null;
          deadline: string | null;
          published: boolean;
          updated_at: string;
          created_at: string;
        }>;

        setJobs(
          items.map((job) => ({
            id: job.id,
            title: job.title_ka,
            department: job.department_ka ?? '',
            description: job.description_ka ?? '',
            deadline: job.deadline ? new Date(job.deadline).toLocaleDateString() : 'არ არის მითითებული',
            status: job.published ? 'published' : 'draft',
            updatedAt: new Date(job.updated_at ?? job.created_at).toLocaleString()
          }))
        );
      } catch {
        setError('ვერ ჩაიტვირთა ვაკანსიები.');
      }
    };

    loadPublishedJobs();
  }, []);

  const clearForm = () => {
    setTitleKa('');
    setTitleEn('');
    setDepartmentKa('');
    setDepartmentEn('');
    setDescriptionKa('');
    setDescriptionEn('');
    setDeadline('');
  };

  const createJob = async (status: JobCard['status']) => {
    if (!titleKa.trim()) {
      setError('სათაური (ქართულად) აუცილებელია.');
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

      const response = await api.post('/api/job-postings', payload);
      const created = toCard(response.data as JobOut);

      setJobs((current) => [created, ...current]);
      setError(null);
      clearForm();
    } catch {
      setError('ვაკანსიის შენახვა ვერ მოხერხდა. შეამოწმეთ ავტორიზაცია და ველის ფორმატი.');
    } finally {
      setSaving(false);
    }
  };

  const publishDraft = async (jobId: number) => {
    setBusyJobId(jobId);

    try {
      const response = await api.put(`/api/job-postings/${jobId}`, {
        published: true,
        published_at: new Date().toISOString()
      });

      const updated = toCard(response.data as JobOut);
      setJobs((current) => current.map((job) => (job.id === jobId ? updated : job)));
      setError(null);
    } catch {
      setError('დრაფტის გამოქვეყნება ვერ მოხერხდა.');
    } finally {
      setBusyJobId(null);
    }
  };

  const removeJob = async (jobId: number) => {
    setBusyJobId(jobId);

    try {
      await api.delete(`/api/job-postings/${jobId}`);
      setJobs((current) => current.filter((job) => job.id !== jobId));
      setError(null);
    } catch {
      setError('ვაკანსიის წაშლა ვერ მოხერხდა.');
    } finally {
      setBusyJobId(null);
    }
  };

  return (
    <div className="jobs-page">
      <div className="jobs-header">
        <h1>ვაკანსიები</h1>
        <p className="hint">დაამატეთ ახალი ვაკანსია ან გამოაქვეყნეთ დრაფტი.</p>
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

      <div className="jobs-list">
        <h2>ვაკანსიების სია</h2>

        {jobs.length === 0 ? (
          <p className="hint">ვაკანსიები ჯერ არ არის.</p>
        ) : (
          jobs.map((job) => (
            <article className="job-card" key={job.id}>
              <div className="job-meta">
                <span className={`status-pill ${job.status}`}>{job.status}</span>
                <span>{job.updatedAt}</span>
              </div>
              <h3>{job.title}</h3>
              {job.department ? <p><strong>დეპარტამენტი:</strong> {job.department}</p> : null}
              <p><strong>ვადა:</strong> {job.deadline}</p>
              {job.description ? <p>{job.description}</p> : null}

              <div className="job-actions">
                {job.status === 'draft' ? (
                  <button type="button" onClick={() => void publishDraft(job.id)} disabled={busyJobId === job.id}>
                    დრაფტის გამოქვეყნება
                  </button>
                ) : null}
                <button type="button" className="button-secondary" onClick={() => void removeJob(job.id)} disabled={busyJobId === job.id}>
                  წაშლა
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
