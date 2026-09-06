import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CircleAlert, Languages, LoaderCircle, MessageSquareText, ShieldCheck, Stethoscope } from "lucide-react";
import { runTriage } from "@/lib/triage";

const urgencyLabel = { emergency: "Emergency", prompt: "See a doctor soon", routine: "Routine visit" };
const urgencyStatus = { emergency: "full", prompt: "limited", routine: "available" };
const examples = ["mujhe do din se aankh mein jalan aur paani aa raha hai", "My ear has been paining since yesterday", "ਮੈਨੂੰ ਗਲੇ ਵਿੱਚ ਦਰਦ ਹੈ", "पेट में हल्का दर्द है और भूख नहीं लग रही"];

export function SymptomTriage({ onOpenHospital }) {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const submit = async (input) => {
    const value = (input ?? text).trim();
    if (value.length < 3 || loading) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await runTriage(value);
      if (data.redirectToEmergency) { navigate("/emergency", { state: { triage: data, input: value } }); return; }
      setResult(data);
    } catch (e) {
      setError(e?.response?.data?.detail || "The assistant could not respond right now. Please try again.");
    } finally { setLoading(false); }
  };

  return <section className="triage-panel" data-testid="symptom-triage-panel">
    <div className="triage-head"><MessageSquareText size={18} /><div><strong>Describe what you're feeling</strong><p>Write in Hindi, English, Punjabi, Hinglish or any Indian language. We match you with a doctor from this directory only.</p></div></div>
    <textarea value={text} onChange={e => setText(e.target.value)} rows={3} placeholder="e.g. mujhe kal se kaan mein dard hai / My eye is red and watering" data-testid="symptom-input" onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }} />
    <div className="triage-actions">
      <div className="triage-examples">{examples.map((ex, i) => <button key={i} type="button" onClick={() => { setText(ex); submit(ex); }} data-testid={`symptom-example-${i}`}>{ex}</button>)}</div>
      <button className="button primary" onClick={() => submit()} disabled={loading || text.trim().length < 3} data-testid="symptom-submit-button">{loading ? <><LoaderCircle size={16} className="spin" /> Matching…</> : <>Find matching doctor <ArrowRight size={16} /></>}</button>
    </div>
    {error && <div className="triage-error" data-testid="triage-error"><CircleAlert size={15} /> {error}</div>}
    {result && <TriageResult result={result} onOpenHospital={onOpenHospital} />}
    <p className="triage-foot"><ShieldCheck size={13} /> Emergency symptoms are redirected immediately. Doctor availability stays unconfirmed until hospital staff update it.</p>
  </section>;
}

function TriageResult({ result, onOpenHospital }) {
  return <div className="triage-result reveal" data-testid="triage-result">
    <div className="triage-meta">
      <span className={`status-pill ${urgencyStatus[result.urgency]}`} data-testid="triage-urgency"><span className="status-dot" />{urgencyLabel[result.urgency]}</span>
      <span className="triage-lang" data-testid="triage-language"><Languages size={13} /> {result.detectedLanguage}</span>
      {result.likelySpecialty && <span className="triage-lang" data-testid="triage-specialty"><Stethoscope size={13} /> {result.likelySpecialty}</span>}
    </div>
    <p className="triage-text" data-testid="triage-response-text">{result.responseText}</p>
    {result.clarifying_question && <div className="triage-clarify" data-testid="triage-clarifying-question"><CircleAlert size={15} /> {result.clarifying_question}</div>}
    {result.matches.length > 0 && <div className="triage-matches">
      <span className="label">Matched from the directory · {result.matches.length}</span>
      {result.matches.map((m, i) => <button key={`${m.hospitalId}-${i}`} className="match-row" onClick={() => onOpenHospital(m.hospitalId)} data-testid={`triage-match-${i}`}>
        <span className="avatar">{m.doctorName.split(" ").filter(Boolean).map(x => x[0]).slice(0, 2).join("")}</span>
        <span className="match-body"><b>{m.doctorName}</b><small>{m.specialty} · {m.hospitalName}</small></span>
        <span className="match-side"><span className="status-pill full"><span className="status-dot" />Unconfirmed</span><small>{m.opdWaitMin == null ? "Wait not reported" : `~${m.opdWaitMin} min wait`}</small></span>
        <ArrowRight size={15} />
      </button>)}
    </div>}
    <p className="triage-disclaimer" data-testid="triage-disclaimer">{result.disclaimer}</p>
  </div>;
}
