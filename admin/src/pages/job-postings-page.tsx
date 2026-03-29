import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ConfirmModal } from '../components/ui/confirm-modal';
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
  title_en: string | null;
  description_ka: string | null;
  description_en: string | null;
  department_ka: string | null;
  department_en: string | null;
  deadline: string | null;
  published: boolean;
  updated_at: string;
};

const toCard = (job: JobOut): JobCard => ({
  id: job.id,
  title: job.title_ka,
  department: job.department_ka ?? '',
  description: job.description_ka ?? '',
  deadline: job.deadline ? new Date(job.deadline).toLocaleDateString() : 'არ არის მითითებული',
  status: job.published ? 'published' : 'draft',
  updatedAt: new Date(job.updated_at).toLocaleString()
});

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
  const [editingJobId, setEditingJobId] = useState<number | null>(null);
  const [editingStatus, setEditingStatus] = useState<JobCard['status']>('draft');
  const [jobToDeleteId, setJobToDeleteId] = useState<number | null>(null);

  const loadJobs = useCallback(async () => {
    try {
      const response = await api.get('/api/job-postings');
      const items = (response.data ?? []) as JobOut[];
      setJobs(items.map((job) => toCard(job)));
      setError(null);
    } catch {
      setError('ვერ ჩაიტვირთა ვაკანსიები.');
    }
  }, []);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const clearForm = () => {
    setTitleKa('');
    setTitleEn('');
    setDepartmentKa('');
    setDepartmentEn('');
    setDescriptionKa('');
    setDescriptionEn('');
    setDeadline('');
    setEditingJobId(null);
    setEditingStatus('draft');
  };

  const saveEdit = async (status: JobCard['status']) => {
    if (editingJobId == null) {
      return;
    }

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

      const response = await api.put(`/api/job-postings/${editingJobId}`, payload);
      const saved = toCard(response.data as JobOut);
      setJobs((current) => current.map((job) => (job.id === editingJobId ? saved : job)));
      setError(null);
      toast.success('ვაკანსია წარმატებით განახლდა.');
      clearForm();
    } catch {
      const message = 'ვაკანსიის განახლება ვერ მოხერხდა.';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = async (jobId: number) => {
    setBusyJobId(jobId);

    try {
      const response = await api.get(`/api/job-postings/${jobId}`);
      const job = response.data as JobOut;

      setEditingJobId(job.id);
      setEditingStatus(job.published ? 'published' : 'draft');
      setTitleKa(job.title_ka ?? '');
      setTitleEn(job.title_en ?? '');
      setDepartmentKa(job.department_ka ?? '');
      setDepartmentEn(job.department_en ?? '');
      setDescriptionKa(job.description_ka ?? '');
      setDescriptionEn(job.description_en ?? '');
      setDeadline(job.deadline ? job.deadline.slice(0, 10) : '');
      setError(null);
      toast.info('ვაკანსიის რედაქტირება შეგიძლიათ ქვემოთ მოცემულ ფორმაში.');
    } catch {
      const message = 'ვაკანსიის დეტალების ჩატვირთვა ვერ მოხერხდა.';
      setError(message);
      toast.error(message);
    } finally {
      setBusyJobId(null);
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
      toast.success('დრაფტი გამოქვეყნდა.');
    } catch {
      setError('დრაფტის გამოქვეყნება ვერ მოხერხდა.');
      toast.error('დრაფტის გამოქვეყნება ვერ მოხერხდა.');
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
      toast.success('ვაკანსია წაიშალა.');
    } catch {
      setError('ვაკანსიის წაშლა ვერ მოხერხდა.');
      toast.error('ვაკანსიის წაშლა ვერ მოხერხდა.');
    } finally {
      setBusyJobId(null);
    }
  };

  return (
    <div className="jobs-page">
      <div className="jobs-header">
        <h1>ვაკანსიები</h1>
        <p className="hint">ყველა ვაკანსიის სია. რედაქტირებისთვის გამოიყენეთ Edit ღილაკი.</p>
        <div className="jobs-actions">
          <Link to="/job-postings/new">
            <button type="button">ახალი ვაკანსიის დამატება</button>
          </Link>
          <button type="button" className="button-secondary" onClick={() => void loadJobs()}>
            განახლება
          </button>
        </div>
      </div>

      {editingJobId ? (
        <div className="jobs-editor">
          <h2>ვაკანსიის რედაქტირება</h2>

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
            {editingStatus === 'published' ? (
              <button type="button" onClick={() => void saveEdit('published')} disabled={saving}>
                ცვლილებების შენახვა
              </button>
            ) : (
              <>
                <button type="button" className="button-secondary" onClick={() => void saveEdit('draft')} disabled={saving}>
                  დრაფტად შენახვა
                </button>
                <button type="button" onClick={() => void saveEdit('published')} disabled={saving}>
                  გამოქვეყნება
                </button>
              </>
            )}
            <button type="button" className="button-secondary" onClick={clearForm} disabled={saving}>
              რედაქტირების გაუქმება
            </button>
          </div>
        </div>
      ) : null}

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
                <button type="button" onClick={() => void startEdit(job.id)} disabled={busyJobId === job.id}>
                  რედაქტირება
                </button>
                {job.status === 'draft' ? (
                  <button type="button" onClick={() => void publishDraft(job.id)} disabled={busyJobId === job.id}>
                    დრაფტის გამოქვეყნება
                  </button>
                ) : null}
                <button type="button" className="button-secondary" onClick={() => setJobToDeleteId(job.id)} disabled={busyJobId === job.id}>
                  წაშლა
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <ConfirmModal
        open={jobToDeleteId !== null}
        title="Delete Job Posting"
        message="This job posting will be deleted permanently."
        confirmLabel="Delete"
        destructive
        busy={jobToDeleteId !== null && busyJobId === jobToDeleteId}
        onCancel={() => setJobToDeleteId(null)}
        onConfirm={() => {
          if (jobToDeleteId == null) {
            return;
          }

          void removeJob(jobToDeleteId);
          setJobToDeleteId(null);
        }}
      />
    </div>
  );
}
