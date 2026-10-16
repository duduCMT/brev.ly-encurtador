export const FRONTEND_URL: string = import.meta.env.VITE_FRONTEND_URL ?? "";
export const BACKEND_URL: string = import.meta.env.VITE_BACKEND_URL ?? "";

export const FRONTEND_HOST_PREFIX = `${FRONTEND_URL.replace(/^https?:\/\//i, "").replace(/\/+$/, "")}/`;
