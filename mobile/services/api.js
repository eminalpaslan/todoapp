import axios from 'axios';

import { getToken } from './storage';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

// Her istege, varsa saklanan token'i otomatik ekler - her servis
// fonksiyonunun kendi basina header eklemesine gerek kalmaz.
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Backend hatalari {"detail": "..."} (HTTPException) veya
// {"detail": [{"msg": "..."}]} (Pydantic validasyon hatasi) seklinde doner.
export function getErrorMessage(error) {
  const detail = error.response?.data?.detail;
  if (typeof detail === 'string') {
    return detail;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    return detail[0].msg;
  }
  return 'Bir seyler ters gitti, lutfen tekrar dene';
}
