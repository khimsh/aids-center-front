import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Button, ButtonLink } from '../../components/ui/button';
import { ConfirmModal } from '../../components/ui/confirm-modal';
import { Input } from '../../components/ui/input';
import {
  deleteJobPosting,
  fetchJobPostingById,
  fetchJobPostings,
  publishJobPostingDraft,
  type JobCard,
  type JobMutationInput,
  updateJobPosting,
} from '../../lib/job-postings';
import { queryKeys } from '../../lib/query-keys';
import './job-postings-page.scss';

export function JobPostingsPage() {
  const queryClient = useQueryClient();
  const [titleKa, setTitleKa] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [departmentKa, setDepartmentKa] = useState('');
  const [departmentEn, setDepartmentEn] = useState('');
  const [descriptionKa, setDescriptionKa] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyJobId, setBusyJobId] = useState<number | null>(null);
  const [editingJobId, setEditingJobId] = useState<number | null>(null);
  const [editingStatus, setEditingStatus] = useState<JobCard['status']>('draft');
  const [jobToDeleteId, setJobToDeleteId] = useState<number | null>(null);

  const jobsQuery = useQuery({
    queryKey: queryKeys.jobPostings,
    queryFn: fetchJobPostings,
  });

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

    const input: JobMutationInput = {
      titleKa,
      titleEn,
      departmentKa,
      departmentEn,
      descriptionKa,
      descriptionEn,
      deadline,
      status,
    };

    try {
      await updateJobPosting(editingJobId, input);
      await queryClient.invalidateQueries({ queryKey: queryKeys.jobPostings });
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
      const job = await queryClient.fetchQuery({
        queryKey: queryKeys.jobPosting(jobId),
        queryFn: () => fetchJobPostingById(jobId),
      });

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
      await publishJobPostingDraft(jobId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.jobPostings });
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
      await deleteJobPosting(jobId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.jobPostings });
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
      </div>

      {jobsQuery.isLoading ? <p className="hint">იტვირთება...</p> : null}

      {editingJobId ? (
        <div className="jobs-editor">
          <h2>ვაკანსიის რედაქტირება</h2>

          <div className="field-row">
            <label>
              სათაური (KA)
              <Input
                value={titleKa}
                onChange={(event) => setTitleKa(event.target.value)}
                required
              />
            </label>

            <label>
              სათაური (EN)
              <Input value={titleEn} onChange={(event) => setTitleEn(event.target.value)} />
            </label>
          </div>

          <div className="field-row">
            <label>
              დეპარტამენტი (KA)
              <Input
                value={departmentKa}
                onChange={(event) => setDepartmentKa(event.target.value)}
              />
            </label>

            <label>
              დეპარტამენტი (EN)
              <Input
                value={departmentEn}
                onChange={(event) => setDepartmentEn(event.target.value)}
              />
            </label>
          </div>

          <div className="field-row">
            <label>
              აღწერა (KA)
              <textarea
                value={descriptionKa}
                onChange={(event) => setDescriptionKa(event.target.value)}
                rows={4}
              />
            </label>

            <label>
              აღწერა (EN)
              <textarea
                value={descriptionEn}
                onChange={(event) => setDescriptionEn(event.target.value)}
                rows={4}
              />
            </label>
          </div>

          <label className="field-single">
            ვადა
            <Input
              type="date"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
            />
          </label>

          {error ? <p className="error">{error}</p> : null}

          <div className="jobs-actions">
            {editingStatus === 'published' ? (
              <Button type="button" onClick={() => void saveEdit('published')} disabled={saving}>
                ცვლილებების შენახვა
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void saveEdit('draft')}
                  disabled={saving}
                >
                  დრაფტად შენახვა
                </Button>
                <Button type="button" onClick={() => void saveEdit('published')} disabled={saving}>
                  გამოქვეყნება
                </Button>
              </>
            )}
            <Button type="button" variant="secondary" onClick={clearForm} disabled={saving}>
              რედაქტირების გაუქმება
            </Button>
          </div>
        </div>
      ) : null}

      <div className="jobs-list">
        <h2>ვაკანსიების სია</h2>

        {jobsQuery.isError ? <p className="error">ვერ ჩაიტვირთა ვაკანსიები.</p> : null}

        {jobsQuery.data?.length === 0 ? (
          <p className="hint">ვაკანსიები ჯერ არ არის.</p>
        ) : (
          (jobsQuery.data ?? []).map((job) => (
            <article className="job-card" key={job.id}>
              <div className="job-meta">
                <span className={`status-pill ${job.status}`}>{job.status}</span>
                <span>{job.updatedAt}</span>
              </div>
              <h3>{job.title}</h3>
              {job.department ? (
                <p>
                  <strong>დეპარტამენტი:</strong> {job.department}
                </p>
              ) : null}
              <p>
                <strong>ვადა:</strong> {job.deadline}
              </p>
              {job.description ? <p>{job.description}</p> : null}

              <div className="job-actions">
                <Button
                  type="button"
                  onClick={() => void startEdit(job.id)}
                  disabled={busyJobId === job.id}
                >
                  რედაქტირება
                </Button>
                {job.status === 'draft' ? (
                  <Button
                    type="button"
                    onClick={() => void publishDraft(job.id)}
                    disabled={busyJobId === job.id}
                  >
                    დრაფტის გამოქვეყნება
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setJobToDeleteId(job.id)}
                  disabled={busyJobId === job.id}
                >
                  წაშლა
                </Button>
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
