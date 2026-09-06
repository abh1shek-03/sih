import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

export const speakText = async (text) => {
  const { data } = await axios.post(`${API}/api/voice/speak`, { text }, { responseType: "blob" });
  return URL.createObjectURL(data);
};

export const transcribeAudio = async (blob) => {
  const form = new FormData();
  form.append("file", blob, "recording.webm");
  const { data } = await axios.post(`${API}/api/voice/listen`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.text;
};

export const recordMic = () => {
  let recorder;
  let chunks = [];
  return {
    start: async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorder = new MediaRecorder(stream);
      chunks = [];
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      recorder.start();
    },
    stop: () => new Promise((resolve) => {
      recorder.onstop = () => {
        recorder.stream.getTracks().forEach((t) => t.stop());
        resolve(new Blob(chunks, { type: "audio/webm" }));
      };
      recorder.stop();
    }),
  };
};
