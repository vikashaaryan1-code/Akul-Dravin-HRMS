import { useAuthStore } from "@/store/auth-store";
import { getPublicApiBaseUrl } from "./api-base";

export const api = async (url: string, options: RequestInit = {}) => {
 const token = useAuthStore.getState().accessToken;
 const baseUrl = getPublicApiBaseUrl();
 
 const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;

 return fetch(fullUrl, {
 ...options,
 headers: {
 ...options.headers,
 ...(token ? { Authorization: `Bearer ${token}` } : {}),
 'Content-Type': 'application/json',
 },
 });
};
