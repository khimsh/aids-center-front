export const queryKeys = {
  dashboardMetrics: (adminView: boolean, userId?: string | number) =>
    ['dashboard-metrics', adminView, userId ?? null] as const,
  users: ['users'] as const,
  articleDrafts: (adminView: boolean, userId?: string | number) =>
    ['article-drafts', adminView, userId ?? null] as const,
  myArticles: (adminView: boolean, userId?: string | number) =>
    ['my-articles', adminView, userId ?? null] as const
};