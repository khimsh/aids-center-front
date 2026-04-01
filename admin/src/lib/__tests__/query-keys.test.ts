import { describe, expect, it } from 'vitest';
import { queryKeys } from '../query-keys';

describe('queryKeys', () => {
  it('builds scoped dashboard key', () => {
    expect(queryKeys.dashboardMetrics(true, 5)).toEqual(['dashboard-metrics', true, 5]);
    expect(queryKeys.dashboardMetrics(false)).toEqual(['dashboard-metrics', false, null]);
  });

  it('builds scoped article keys', () => {
    expect(queryKeys.articleDrafts(true, '1')).toEqual(['article-drafts', true, '1']);
    expect(queryKeys.myArticles(false)).toEqual(['my-articles', false, null]);
    expect(queryKeys.deletedArticles(false, 11)).toEqual(['deleted-articles', false, 11]);
  });

  it('builds job posting keys', () => {
    expect(queryKeys.jobPostings).toEqual(['job-postings']);
    expect(queryKeys.jobPosting(88)).toEqual(['job-posting', 88]);
  });

  it('builds doctors keys', () => {
    expect(queryKeys.doctors).toEqual(['doctors']);
    expect(queryKeys.doctor(12)).toEqual(['doctor', 12]);
  });
});
