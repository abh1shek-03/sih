import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

export const fetchAllPhotos = async (ids) => {
  const { data } = await axios.get(`${API}/api/hospitals/photos`, { params: { ids: (ids || []).join(",") } });
  return data;
};

export const fetchVerifiedMap = async (ids) => {
  const { data } = await axios.get(`${API}/api/hospitals/verified`, { params: { ids: (ids || []).join(",") } });
  return data;
};

export const fetchPhoto = async (hospitalId) => {
  try {
    const { data } = await axios.get(`${API}/api/hospitals/${hospitalId}/photo`);
    return data;
  } catch {
    return null;
  }
};

export const uploadHospitalPhoto = async (hospitalId, file) => {
  const form = new FormData();
  form.append("file", file);
  const { data } = await axios.post(`${API}/api/hospitals/${hospitalId}/photo`, form, {
    withCredentials: true,
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const removeHospitalPhoto = async (hospitalId) => {
  const { data } = await axios.delete(`${API}/api/hospitals/${hospitalId}/photo`, { withCredentials: true });
  return data;
};
