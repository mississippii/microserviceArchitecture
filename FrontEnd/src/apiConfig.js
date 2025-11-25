// Backend server configuration
export const BACKEND_HOST = "http://192.168.0.177:8001";
export const BACKEND_PATH = "/BACKEND";
export const OLD_IMAGE_HOST = "192.168.0.177:8001";
export const NEW_IMAGE_HOST = "192.168.0.177:8081";

export const API_BASE = `${BACKEND_HOST}${BACKEND_PATH}/api/guest`;
export const STUDENT_API = `${API_BASE}/students`;
export const IMAGE_BASE = `${BACKEND_HOST}${BACKEND_PATH}`;
