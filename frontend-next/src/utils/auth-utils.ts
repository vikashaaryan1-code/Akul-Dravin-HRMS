import { jwtDecode } from "jwt-decode";

export const isTokenExpired = (token: string): boolean => {
 try {
 const decoded = jwtDecode(token);
 if (!decoded.exp) return false;
 return decoded.exp * 1000 < Date.now();
 } catch {
 return true; /* If decoding fails, assume expired/invalid */ }
};
