import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

export const login = async (email, password) => {
  const { data } = await axios.post(`${API}/api/auth/login`, { email, password }, { withCredentials: true });
  return data;
};

export const registerStaff = async (email, password, hospitalId) => {
  const { data } = await axios.post(
    `${API}/api/auth/register`,
    { email, password, hospitalId },
    { withCredentials: true }
  );
  return data;
};

export const listAuthHospitals = async () => {
  const { data } = await axios.get(`${API}/api/auth/hospitals`);
  return data;
};

export const logout = async () => {
  await axios.post(`${API}/api/auth/logout`, {}, { withCredentials: true });
};

export const me = async () => {
  try {
    const { data } = await axios.get(`${API}/api/auth/me`, { withCredentials: true });
    return data;
  } catch {
    return null;
  }
};
