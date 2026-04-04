import { api } from './api';

export type JobCard = {
  id: number;
  title: string;
  department: string;
  description: string;
  deadline: string;
  status: 'draft' | 'published';
  updatedAt: string;
};

export type JobOut = {
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

export type JobMutationInput = {
  titleKa: string;
  titleEn: string;
  departmentKa: string;
  departmentEn: string;
  descriptionKa: string;
  descriptionEn: string;
  deadline: string;
  status: 'draft' | 'published';
};

export const toJobCard = (job: JobOut): JobCard => ({
  id: job.id,
  title: job.title_ka,
  department: job.department_ka ?? '',
  description: job.description_ka ?? '',
  deadline: job.deadline ? new Date(job.deadline).toLocaleDateString() : 'არ არის მითითებული',
  status: job.published ? 'published' : 'draft',
  updatedAt: new Date(job.updated_at).toLocaleString(),
});

function toJobPayload(input: JobMutationInput) {
  return {
    title_ka: input.titleKa.trim(),
    title_en: input.titleEn.trim() || null,
    description_ka: input.descriptionKa.trim() || null,
    description_en: input.descriptionEn.trim() || null,
    department_ka: input.departmentKa.trim() || null,
    department_en: input.departmentEn.trim() || null,
    deadline: input.deadline ? new Date(input.deadline).toISOString() : null,
    published: input.status === 'published',
    published_at: input.status === 'published' ? new Date().toISOString() : null,
  };
}

export async function fetchJobPostings(): Promise<JobCard[]> {
  const response = await api.get('/api/job-postings');
  const items = (response.data ?? []) as JobOut[];
  return items.map((job) => toJobCard(job));
}

export async function fetchJobPostingById(jobId: number): Promise<JobOut> {
  const response = await api.get(`/api/job-postings/${jobId}`);
  return response.data as JobOut;
}

export async function updateJobPosting(jobId: number, input: JobMutationInput): Promise<JobOut> {
  const response = await api.put(`/api/job-postings/${jobId}`, toJobPayload(input));
  return response.data as JobOut;
}

export async function publishJobPostingDraft(jobId: number): Promise<JobOut> {
  const response = await api.put(`/api/job-postings/${jobId}`, {
    published: true,
    published_at: new Date().toISOString(),
  });
  return response.data as JobOut;
}

export async function deleteJobPosting(jobId: number): Promise<void> {
  await api.delete(`/api/job-postings/${jobId}`);
}
