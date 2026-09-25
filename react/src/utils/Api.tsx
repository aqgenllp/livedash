// api.ts
import axios from 'axios';
const API = import.meta.env.VITE_API_URL;

export const api = axios.create({ baseURL: `${API}`, withCredentials: true, timeout: 10000 });

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (!error.response) {
      return Promise.reject({
        status: 0,
        message: 'No internet connection',
      });
    }
    return Promise.reject({
      ...error,
      status: error.response.status,
      data: error.response.data,
    });
  }
); 
