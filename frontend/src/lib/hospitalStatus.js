import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

export const fetchAllStatus = async (ids) => {
  const { data } = await axios.get(`${API}/api/hospitals/status`, { params: { ids: ids.join(",") } });
  return data;
};

export const fetchStatus = async (hospitalId) => {
  const { data } = await axios.get(`${API}/api/hospitals/${hospitalId}/status`);
  return data;
};

export const admitWard = async (hospitalId, wardId) => {
  const { data } = await axios.post(`${API}/api/hospitals/${hospitalId}/wards/${wardId}/admit`, {}, { withCredentials: true });
  return data;
};

export const dischargeWard = async (hospitalId, wardId) => {
  const { data } = await axios.post(`${API}/api/hospitals/${hospitalId}/wards/${wardId}/discharge`, {}, { withCredentials: true });
  return data;
};

export const setDoctorStatus = async (hospitalId, doctorId, status) => {
  const { data } = await axios.patch(`${API}/api/hospitals/${hospitalId}/doctors/${doctorId}`, { status }, { withCredentials: true });
  return data;
};
