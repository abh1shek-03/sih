import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

export const createCallbackRequest = async (payload) => {
  const { data } = await axios.post(`${API}/api/callbacks`, payload);
  return data;
};

export const listCallbackRequests = async () => {
  const { data } = await axios.get(`${API}/api/callbacks`, { withCredentials: true });
  return data;
};

export const resolveCallbackRequest = async (id) => {
  const { data } = await axios.patch(`${API}/api/callbacks/${id}`, null, { withCredentials: true });
  return data;
};
