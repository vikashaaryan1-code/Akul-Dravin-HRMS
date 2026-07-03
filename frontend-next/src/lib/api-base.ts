const DEFAULT_API_BASE_URL = 'http://localhost:4001/api/v1';

export const getPublicApiBaseUrl = () =>
 (process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/$/, '');
