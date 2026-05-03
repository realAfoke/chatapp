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
let authSetter = null
export const setAuthToken = (fn) => {
  authSetter = fn
}

//request interceptore
api.interceptors.request.use((config) => {

  const token = localStorage.getItem('access')
  if (token) {
    config.headers = { ...config.headers, Authorization: `Bearer ${token}` }
  }
  return config
})
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (e) => {
    const initalConfig = e.config;
    if (e?.response?.status !== 401) {
      return Promise.reject(e);
    }
    if (initalConfig._retry) {
      return Promise.reject(e);
    }
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedRequest.push({ resolve, reject });
      }).then(() => {
        return api(initalConfig);
      });
    }
    initalConfig._retry = true;
    isRefreshing = true;
    try {
      //const refresh = await axios.post(`${import.meta.env.VITE_API_URL}/refresh-token/`);
      const refreshToken = localStorage.getItem('refresh')
      if (refreshToken) {
        const refresh = await axios.post(`${import.meta.env.VITE_API_URL}/api/refresh-token/`, { 'refresh': refreshToken })
        if (authSetter) {
          authSetter((prev) => ({ ...prev, token: refresh.data.access }))
        }
        localStorage.setItem('access', refresh.data.access)
        processFailedRequest(null);
        return api(initalConfig);
      }
      throw new Error('token not found')
    } catch (error) {
      processFailedRequest(error);
      localStorage.removeItem('access')
      localStorage.removeItem('refresh')
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



let reschedule = null

export function refreshTokenScheduler(action = 'start') {
  if (action === 'stop') {
    if (reschedule) {
      clearTimeout(reschedule)
    }
  }
  const refreshToken = localStorage.getItem('refresh')
  if (!refreshToken) return
  axios.post(`${import.meta.env.VITE_API_URL}/api/refresh-token/`, { refresh: refreshToken })
    .then((res) => {
      if (authSetter) {
        authSetter((prev) => ({ ...prev, token: res.data.access }))
      }
      localStorage.setItem('access', res.data.access)
      const payLoad = JSON.parse(atob(res.data.access.split('.')[1]))
      const refreshIn = payLoad.exp * 1000 - Date.now() - 6000

      reschedule = setTimeout(() => refreshTokenScheduler('start'), refreshIn)
    }).catch((error) => {
      console.error(error)
      if (authSetter) {
        authSetter((prev) => ({ ...prev, token: null }))
      }

      localStorage.removeItem('access')
      localStorage.removeItem('refresh')
      refreshTokenScheduler('stop')
      window.location.href = '/login'
      return Promise.reject(error)
    })

}


refreshTokenScheduler()


let db = null
let queue = []
let isOpening = false

export function getDb() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db)
      return
    }
    queue.push({ resolve, reject })
    if (isOpening) return
    isOpening = true

    const request = indexedDB.open('CHATDB', 1)
    request.onupgradeneeded = (event) => {
      const database = event.target.result
      if (!database.objectStoreNames.contains('messages')) {
        const store = database.createObjectStore('messages', { keyPath: 'clientId' })
        store.createIndex('conversation_createdAt', ['conversation', 'createdAt'])

      }
    }
    request.onsuccess = (event) => {
      db = event.target.result
      queue.forEach((prom) => prom.resolve(db))
      queue = []
    }
    request.onerror = () => {
      console.log(request.error)
      queue.forEach((prom) => prom.reject(request.error))
      queue = []
    }
    return db
  })
}























