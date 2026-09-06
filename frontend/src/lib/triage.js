import axios from "axios";
import { api } from "@/lib/api";

const API = process.env.REACT_APP_BACKEND_URL;

export const toHospitalData = () => api.getHospitals().map(h => ({
  id: h.id, name: h.name, distanceKm: null, verified: h.verificationStatus === "verified",
  icu: typeof h.emergency?.icuBeds === "number" ? h.emergency.icuBeds : null, general: null, opdWaitMin: null,
  doctors: h.doctors.map(d => ({ name: d.name, specialty: d.specialization, status: d.status || "unavailable" })),
}));

export const getSessionId = () => {
  let id = sessionStorage.getItem("mc-triage-session");
  if (!id) { id = crypto.randomUUID(); sessionStorage.setItem("mc-triage-session", id); }
  return id;
};

export const runTriage = async (patientInput) => {
  const { data } = await axios.post(`${API}/api/triage`, { patientInput, hospitals: toHospitalData(), sessionId: getSessionId() });
  return data;
};
