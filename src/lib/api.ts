import axios from "axios";
import { config } from "./config";
/**
 * Backend response'dan array chiqarib oluvchi helper.
 * Netlify/production'da backend ba'zida paginated object qaytarishi mumkin.
 */
export function safeArray<T = any>(res: any): T[] {
  const raw = res?.data ?? res;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.content)) return raw.content;  // Spring Page<T>
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.results)) return raw.results;
  return [];
}



/**
 * ✅ Deploy (Netlify) uchun:
 * - `VITE_API_BASE_URL` -> backend api root (masalan: https://api.example.com/api)
 * - local devda esa Vite proxy ishlashi uchun default '/api'
 */
export const API_BASE_URL =
  // Use runtime-config aware getter (loadRuntimeConfig runs before app render)
  (config.API_BASE_URL || import.meta.env.VITE_API_BASE_URL || "/api").replace(
    /\/$/,
    "",
  );

// Backend origin (faqat statik fayllar/rasmlar uchun). Ixtiyoriy.
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// ✅ Public endpointlar uchun: Authorization yubormaydigan axios instance.
// Ba'zi backend konfiguratsiyalarda (permitAll bo'lsa ham) JWT filter noto'g'ri tokenni
// ko'rib 401/403 qaytarishi mumkin. Shuning uchun public list/detail'larni noAuthApi bilan chaqiramiz.
const noAuthApi = axios.create({
  baseURL: API_BASE_URL,
});

// Public (no /api prefix) endpoints, e.g. /i/{token}
// If BACKEND_URL is empty, it will use current origin.
const publicApi = axios.create({
  baseURL: (BACKEND_URL || "").replace(/\/$/, ""),
});

// JWT interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");

      if (refreshToken) {
        try {
          const res = await api.post("/auth/refresh", { refreshToken });

          localStorage.setItem("accessToken", res.data.accessToken);
          localStorage.setItem("refreshToken", res.data.refreshToken);

          originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  },
);

// ================= AUTH =================
export const authApi = {
  verifyLogin: (email: string, code: string) =>
    api.post("/auth/verify-login", {
      email: email.trim().toLowerCase(),
      code: code.replace(/\s/g, "").trim(),
    }),
  verifyRegister: (email: string, code: string) =>
    api.post("/auth/verify-register", {
      email: email.trim().toLowerCase(),
      code: code.replace(/\s/g, "").trim(),
    }),
  login: (email: string) =>
    api.post("/auth/login", { email: email.trim().toLowerCase() }),
  refresh: (refreshToken: string) =>
    api.post("/auth/refresh", { refreshToken }),
  logout: (refreshToken: string) => api.post("/auth/logout", { refreshToken }),
  forceLogout: (userId: number) => api.post(`/auth/force-logout/${userId}`),
};

// ================= USERS =================
export const usersApi = {
  getAll: () => api.get("/users"),
  getById: (id: number) => api.get(`/users/${id}`),
  createViaRegister: (data: {
    fullName: string;
    email: string;
    phone: string;
    country: string;
  }) => api.post("/auth/register", data),
  createDirect: (data: {
    fullName: string;
    email: string;
    phone: string;
    country: string;
  }) => api.post("/users", data),
  update: (
    id: number,
    data: { fullName: string; email: string; phone: string; country: string },
  ) => api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
  setEnabled: (id: number, enabled: boolean) =>
    api.patch(`/users/${id}/enabled?enabled=${enabled}`),
};

// ================= ORGANIZATIONS =================
export const orgsApi = {
  getAll: () => api.get("/organizations"),
  getById: (id: number) => api.get(`/organizations/${id}`),
  getVerified: () => api.get("/organizations/verified"),
  create: (data: {
    name: string;
    description: string;
    address: string;
    phone: string;
  }) => api.post("/organizations", data),
  update: (
    id: number,
    data: { name: string; description: string; address: string; phone: string },
  ) => api.put(`/organizations/${id}`, data),
  delete: (id: number) => api.delete(`/organizations/${id}`),
  verify: (id: number, verified: boolean) =>
    api.patch(`/organizations/${id}/verify?verified=${verified}`),
};

// ================= ADMIN =================
export const adminOrgsApi = {
  approve: (id: number) => api.post(`/admin/organizations/${id}/approve`),
  reject: (id: number, reason: string) =>
    api.post(
      `/admin/organizations/${id}/reject?reason=${encodeURIComponent(reason)}`,
    ),
};

export const superAdminApi = {
  // ✅ backend: POST /api/admin/users/{userId}/make-admin
  makeAdmin: (userId: number) => api.post(`/admin/users/${userId}/make-admin`),
};

export const adminUsersApi = {
  // ✅ backend: POST /api/admin/users/{userId}/make-tour
  makeTourOrganization: (userId: number) =>
    api.post(`/admin/users/${userId}/make-tour`),
  // alias (old code expects makeTour)
  makeTour: (userId: number) => api.post(`/admin/users/${userId}/make-tour`),
};

// ================= ADMIN EVENTS =================
// Backend:
// - GET  /api/admin/events/pending
// - POST /api/admin/events/{id}/approve
// - POST /api/admin/events/{id}/reject?reason=...
export const adminEventsApi = {
  pending: () => api.get("/admin/events/pending"),
  approve: (id: number) => api.post(`/admin/events/${id}/approve`),
  reject: (id: number, reason: string) =>
    api.post(`/admin/events/${id}/reject?reason=${encodeURIComponent(reason)}`),
};

// ================= MANAGEMENT (ADMIN / SUPER_ADMIN) =================
export const managementApi = {
  getUsers: () => api.get("/management/users"),
  getTourOrganizations: () => api.get("/management/tour-organizations"),
  getAdmins: () => api.get("/management/admins"),
  getSuperAdmins: () => api.get("/management/super-admins"),
};

// ================= EVENTS =================
export const eventsApi = {
  getAll: () => api.get("/events"),
  getById: (id: number) => api.get(`/events/${id}`),
  /**
   * ✅ Backendda /events/upcoming yo‘q.
   * Shuning uchun upcoming eventlarni /events (APPROVED) dan olib,
   * client tomonda `eventDateTime >= now` bo‘yicha filtrlaymiz.
   */
  getUpcoming: () =>
    api.get("/events").then((res) => {
      const now = new Date();
      const list = Array.isArray(res.data) ? res.data : [];
      const upcoming = list
        .filter((e: any) => {
          const dt = e?.eventDateTime ? new Date(e.eventDateTime) : null;
          return dt && !Number.isNaN(dt.getTime()) && dt >= now;
        })
        .sort((a: any, b: any) => {
          const da = new Date(a?.eventDateTime ?? 0).getTime();
          const db = new Date(b?.eventDateTime ?? 0).getTime();
          return da - db;
        });
      return { ...res, data: upcoming };
    }),
  getMy: () => api.get("/events/my"),
  create: (data: {
    title: string;
    description: string;
    locationName: string;
    latitude: number;
    longitude: number;
    eventDateTime: string;
    organizationId: number;
    files?: File[];
  }) => {
    const form = new FormData();
    form.append("title", data.title);
    form.append("description", data.description);
    form.append("locationName", data.locationName);
    form.append("latitude", String(data.latitude));
    form.append("longitude", String(data.longitude));
    form.append("eventDateTime", data.eventDateTime);
    form.append("organizationId", String(data.organizationId));

    if (data.files && data.files.length) {
      data.files.forEach((f) => form.append("files", f));
    }

    return api.post("/events", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/events/${id}`, data),
  delete: (id: number) => api.delete(`/events/${id}`),
};

// ================= EVENT IMAGES =================
export const eventImagesApi = {
  upload: (eventId: number, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return api.post(`/events/${eventId}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getImages: (eventId: number) => api.get(`/events/${eventId}/images`),
};

// ================= REGISTRATIONS =================
export const registrationsApi = {
  register: (eventId: number) => api.post(`/registrations?eventId=${eventId}`),
  getAll: () => api.get("/registrations"),
  getById: (id: number) => api.get(`/registrations/${id}`),
  getByUser: (userId: number) => api.get(`/registrations/user/${userId}`),
  getCountByEvent: (eventId: number) =>
    api.get(`/registrations/event/${eventId}/count`),
  delete: (id: number) => api.delete(`/registrations/${id}`),
};

// ================= LIKES / COMMENTS =================
export const likesApi = {
  toggle: (eventId: number) => api.post(`/events/${eventId}/like`),
  count: (eventId: number) => api.get(`/events/${eventId}/likes`),
};

export const commentsApi = {
  create: (eventId: number, text: string) =>
    api.post(`/events/${eventId}/comments`, { text }),
  getAll: (eventId: number) => api.get(`/events/${eventId}/comments`),
  delete: (commentId: number) => api.delete(`/events/comments/${commentId}`),
};

// ================= PUBLIC IMAGE STATS =================
export const publicImagesApi = {
  // GET /i/{token} => viewCount++ and returns image info
  view: (token: string) => publicApi.get(`/i/${token}`),
  // POST /i/{token}/share => shareCount++
  share: (token: string) => publicApi.post(`/i/${token}/share`),
};

// ================= ACCOMMODATIONS (HOTEL / HOSTEL) =================
export const accommodationsApi = {
  // public
  // ⚠️ public list'lar Authorization'siz ketadi
  getHotels: () => api.get("/accommodations/hotels"),
  getHostels: () => api.get("/accommodations/hostels"),

  // admin
  createHotel: (data: {
    name: string;
    description: string;
    city: string;
    address: string;
    latitude: number;
    longitude: number;
    stars: number;
    amenityIds?: number[];
    files?: File[];
  }) => {
    const form = new FormData();
    form.append("name", data.name);
    form.append("description", data.description);
    form.append("city", data.city);
    form.append("address", data.address);
    form.append("latitude", String(data.latitude));
    form.append("longitude", String(data.longitude));
    form.append("stars", String(data.stars));
    (data.amenityIds || []).forEach((id) =>
      form.append("amenityIds", String(id)),
    );
    (data.files || []).forEach((f) => form.append("files", f));
    return api.post("/accommodations/hotel", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  createHostel: (data: {
    name: string;
    description: string;
    city: string;
    address: string;
    latitude: number;
    longitude: number;
    amenityIds?: number[];
    files?: File[];
  }) => {
    const form = new FormData();
    form.append("name", data.name);
    form.append("description", data.description);
    form.append("city", data.city);
    form.append("address", data.address);
    form.append("latitude", String(data.latitude));
    form.append("longitude", String(data.longitude));
    (data.amenityIds || []).forEach((id) =>
      form.append("amenityIds", String(id)),
    );
    (data.files || []).forEach((f) => form.append("files", f));
    return api.post("/accommodations/hostel", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// ================= AMENITIES =================
export const amenitiesApi = {
  getAll: () => api.get("/amenities"),
  create: (name: string) =>
    api.post(`/amenities?name=${encodeURIComponent(name)}`),
  delete: (id: number) => api.delete(`/amenities/${id}`),
};

// ================= HOSTEL REVIEWS =================
export const hostelReviewsApi = {
  list: (hostelId: number) => api.get(`/hostels/${hostelId}/reviews`),
  average: (hostelId: number) =>
    api.get(`/hostels/${hostelId}/reviews/average`),
  count: (hostelId: number) => api.get(`/hostels/${hostelId}/reviews/count`),
  create: (hostelId: number, rating: number, comment: string) =>
    api.post(
      `/hostels/${hostelId}/reviews?rating=${encodeURIComponent(String(rating))}&comment=${encodeURIComponent(comment)}`,
    ),
};

export default api;
