const BASE_URL = import.meta.env.VITE_API_URL || 'https://sheen-bazaar-api.onrender.com/api';

function getToken() {
  return localStorage.getItem('bazaario_token');
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  // Products
  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/products${qs ? `?${qs}` : ''}`);
  },
  getCategories: () => request('/products/categories'),
  getProduct: (id) => request(`/products/${id}`),
  getRelated: (id) => request(`/products/${id}/related`),

  // Auth
  signup: (payload) => request('/auth/signup', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: () => request('/auth/me', { auth: true }),

  // Cart
  getCart: () => request('/cart', { auth: true }),
  updateCart: (productId, delta, resellerId) => request('/cart', { method: 'POST', body: { productId, delta, resellerId }, auth: true }),
  removeFromCart: (productId, resellerId) => request(`/cart/${productId}${resellerId ? `?resellerId=${resellerId}` : ''}`, { method: 'DELETE', auth: true }),
  clearCart: () => request('/cart', { method: 'DELETE', auth: true }),

  // Orders
  placeOrder: (payload) => request('/orders', { method: 'POST', body: payload, auth: true }),
  getOrders: () => request('/orders', { auth: true }),
  getOrder: (id) => request(`/orders/${id}`, { auth: true }),

  // Seller
  sellerMe: () => request('/seller/me', { auth: true }),
  sellerGetProducts: () => request('/seller/products', { auth: true }),
  sellerCreateProduct: (payload) => request('/seller/products', { method: 'POST', body: payload, auth: true }),
  sellerUpdateProduct: (id, payload) => request(`/seller/products/${id}`, { method: 'PUT', body: payload, auth: true }),
  sellerDeleteProduct: (id) => request(`/seller/products/${id}`, { method: 'DELETE', auth: true }),
  sellerGetOrders: () => request('/seller/orders', { auth: true }),
  sellerGetCouriers: () => request('/seller/couriers', { auth: true }),
  sellerGetEarnings: () => request('/seller/earnings', { auth: true }),
  sellerUpdateOrderStatus: (id, payload) =>
    request(`/seller/orders/${id}/status`, { method: 'PATCH', body: payload, auth: true }),

  // Admin
  adminStats: () => request('/admin/stats', { auth: true }),
  adminGetUsers: (role) => request(`/admin/users${role ? `?role=${role}` : ''}`, { auth: true }),
  adminUpdateUser: (id, payload) => request(`/admin/users/${id}`, { method: 'PATCH', body: payload, auth: true }),
  adminDeleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE', auth: true }),
  adminGetProducts: () => request('/admin/products', { auth: true }),
  adminUpdateProduct: (id, payload) => request(`/admin/products/${id}`, { method: 'PATCH', body: payload, auth: true }),
  adminDeleteProduct: (id) => request(`/admin/products/${id}`, { method: 'DELETE', auth: true }),
  adminGetOrders: () => request('/admin/orders', { auth: true }),
  adminUpdateOrderStatus: (id, status, note) =>
    request(`/admin/orders/${id}/status`, { method: 'PATCH', body: { status, note }, auth: true }),
  adminGetSettings: () => request('/admin/settings', { auth: true }),
  adminUpdateSettings: (payload) => request('/admin/settings', { method: 'PUT', body: payload, auth: true }),

  // Reseller
  resellerMe: () => request('/reseller/me', { auth: true }),
  resellerGetCatalog: () => request('/reseller/catalog', { auth: true }),
  resellerGetListings: () => request('/reseller/listings', { auth: true }),
  resellerCreateListing: (payload) => request('/reseller/listings', { method: 'POST', body: payload, auth: true }),
  resellerUpdateListing: (productId, payload) => request(`/reseller/listings/${productId}`, { method: 'PATCH', body: payload, auth: true }),
  resellerDeleteListing: (productId) => request(`/reseller/listings/${productId}`, { method: 'DELETE', auth: true }),
  resellerGetOrders: () => request('/reseller/orders', { auth: true }),
  resellerGetEarnings: () => request('/reseller/earnings', { auth: true }),
  getResellerStorefront: (resellerId) => request(`/products/reseller/${resellerId}`),
};

export { getToken };
