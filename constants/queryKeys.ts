export const QueryKeys = {
  profile: (id: string) => ['profile', id] as const,
  jobs: ['jobs'] as const,
  job: (id: string) => ['job', id] as const,
  inventory: ['inventory'] as const,
  notifications: ['notifications'] as const,
  earnings: ['earnings'] as const
};
