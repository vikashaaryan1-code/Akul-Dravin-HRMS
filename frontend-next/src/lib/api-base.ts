const DEFAULT_API_BASE_URL = 'http://localhost:4001/api/v1';

export const getPublicApiBaseUrl = () => {
  let url = (process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/$/, '');
  if (!url.includes('/api/v1') && !url.includes('/api')) {
    url = `${url}/api/v1`;
  }
  return url;
};
