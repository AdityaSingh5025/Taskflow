import axios from "axios";

// Axios instance — baseURL uses Vite proxy so no CORS issues in dev
const api = axios.create({
  baseURL: "/api",
  withCredentials: true, // sends HttpOnly refreshToken cookie automatically
});

// Token is injected before each request by the interceptor below.
// We store the setter here so the AuthContext can register it.
let _getToken = () => null;
let _onUnauth = () => { };

export const setTokenGetter = (fn) => { _getToken = fn; };
export const setUnauthHandler = (fn) => { _onUnauth = fn; };

// Attach Bearer access token to every request
api.interceptors.request.use((config) => {
  const token = _getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 → silently refresh → retry original request once
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post(
          "/api/auth/refresh",
          {},
          { withCredentials: true }
        );
        // Update token in context
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        _onUnauth(); // clears auth state → ProtectedRoute redirects to /login
      }
    }
    return Promise.reject(error);
  }
);

export default api;
