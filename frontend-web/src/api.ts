const API_URL = 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

// ─── AUTH ────────────────────────────────────────────
export const registerUser = async (data: any) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const loginUser = async (data: any) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
  const res = await fetch(`${API_URL}/auth/change-password`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ currentPassword, newPassword })
  });
  return res.json();
};

export const deleteAccount = async (password: string) => {
  const res = await fetch(`${API_URL}/auth/account`, {
    method: 'DELETE',
    headers: getHeaders(),
    body: JSON.stringify({ password })
  });
  return res.json();
};

// ─── USER ────────────────────────────────────────────
export const fetchUser = async (userId: string) => {
  const res = await fetch(`${API_URL}/users/${userId}`, {
    headers: getHeaders()
  });
  return res.json();
};

export const updateUser = async (userId: string, data: { name?: string; allergies?: string[]; calorieGoal?: number }) => {
  const res = await fetch(`${API_URL}/users/${userId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return res.json();
};

// ─── SCAN ────────────────────────────────────────────
export const scanProduct = async (userId: string, barcode: string, ocrText?: string, servingSize: number = 100) => {
  const res = await fetch(`${API_URL}/scan`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ userId, barcode, ocrText, servingSize })
  });
  return res.json();
};

export const getScanHistory = async (userId: string, limit: number = 10) => {
  const res = await fetch(`${API_URL}/scan/history/${userId}?limit=${limit}`, {
    headers: getHeaders()
  });
  return res.json();
};

export const markScanConsumed = async (scanId: string, servingSize?: number) => {
  const res = await fetch(`${API_URL}/scan/${scanId}/consume`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(servingSize ? { servingSize } : {})
  });
  return res.json();
};

export const unmarkScanConsumed = async (scanId: string) => {
  const res = await fetch(`${API_URL}/scan/${scanId}/unconsume`, {
    method: 'PATCH',
    headers: getHeaders()
  });
  return res.json();
};

export const dismissScan = async (scanId: string) => {
  const res = await fetch(`${API_URL}/scan/${scanId}/dismiss`, {
    method: 'PATCH',
    headers: getHeaders()
  });
  return res.json();
};

export const restoreScan = async (scanId: string) => {
  const res = await fetch(`${API_URL}/scan/${scanId}/restore`, {
    method: 'PATCH',
    headers: getHeaders()
  });
  return res.json();
};

export const deleteScan = async (scanId: string) => {
  const res = await fetch(`${API_URL}/scan/${scanId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return res.json();
};

// ─── FOOD ────────────────────────────────────────────
export const getFoodByBarcode = async (barcode: string) => {
  const res = await fetch(`${API_URL}/food/${barcode}`, {
    headers: getHeaders()
  });
  return res.json();
};

export const searchFood = async (query: string) => {
  const res = await fetch(`${API_URL}/food/search?q=${encodeURIComponent(query)}`, {
    headers: getHeaders()
  });
  return res.json();
};

export const fetchDailyAdvice = async () => {
  const res = await fetch(`${API_URL}/users/advice`, {
    headers: getHeaders()
  });
  return res.json();
};
export const logNaturalMeal = async (userId: string, mealDescription: string) => {
  const res = await fetch(`${API_URL}/scan/natural`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ userId, mealDescription })
  });
  return res.json();
};

export const fetchHealthScore = async (userId: string, days: number = 7) => {
  const res = await fetch(`${API_URL}/users/${userId}/health-score?days=${days}`, {
    headers: getHeaders()
  });
  return res.json();
};
