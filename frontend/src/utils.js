import axios from "axios";
import applyCaseMiddleware from "axios-case-converter";
export const api = applyCaseMiddleware(
  axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
  }),
);

let failedRequest = [];
let isRefreshing = false;

const processFailedRequest = (error, token = null) => {
  failedRequest.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedRequest = [];
};
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (e) => {
    const initalConfig = e.config;
    if (e.status !== 401) {
      return new Promise.reject(error);
    }
    if (initalConfig._retry) {
      return new Promise.reject(eror);
    }
    if (isRefreshing) {
      return new Promise((reject, resolve) => {
        failedRequest.push({ reject, resolve });
      }).then(() => {
        return api(initalConfig);
      });
    }
    initalConfig._retry = true;
    isRefreshing = true;
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/refresh-token/`);
      processFailedRequest(null);
      return api(initalConfig);
    } catch (error) {
      processFailedRequest(error);
      window.location.href = "/login";
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);

export function generateRandomColors() {
  const r = Math.floor(Math.random() * 156 + 100);
  const g = Math.floor(Math.random() * 256) + 100;
  const b = Math.floor(Math.random() * 156 + 100);
  return `rgb(${r},${g},${b})`;
}
