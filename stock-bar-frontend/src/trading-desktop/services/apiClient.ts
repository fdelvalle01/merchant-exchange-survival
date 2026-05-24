import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig
} from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

export const apiClient = axios.create({
  baseURL: API_BASE_URL
});

type AccessTokenProvider = () => Promise<string | undefined> | string | undefined;

let accessTokenProvider: AccessTokenProvider | null = null;

export function setAccessTokenProvider(provider: AccessTokenProvider | null) {
  accessTokenProvider = provider;
}

function attachAuthInterceptor(client: AxiosInstance) {
  client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const token = await accessTokenProvider?.();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });
}

attachAuthInterceptor(apiClient);
attachAuthInterceptor(axios);
