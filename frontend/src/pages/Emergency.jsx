import { Link, useLocation } from "react-router-dom";
import { Ambulance, ArrowLeft, CircleAlert, Phone, ShieldCheck } from "lucide-react";

export default function Emergency() {
  const { state } = useLocation();
  const triage = state?.triage;
  return <main className="emergency-page page-wrap" data-testid="smart-emergency-screen">
    <div className="emergency-banner"><span className="emergency-mark"><Ambulance size={26} /></span><div><p className="eyebrow emergency-eyebrow">SMART EMERGENCY</p><h1>This may need<br /><em>immediate care.</em></h1></div></div>
    {triage && <div className="emergency-card"><p className="emergency-text" data-testid="emergency-response-text">{triage.responseText}</p>{state?.input && <small className="muted">You wrote: “{state.input}”</small>}</div>}
    <div className="emergency-actions">
      <a className="button emergency-call" href="tel:108" data-testid="emergency-call-108"><Phone size={18} /> Call 108 · Ambulance</a>
      <a className="button emergency-call secondary" href="tel:112" data-testid="emergency-call-112"><Phone size={18} /> Call 112 · Emergency</a>
    </div>
    <div className="emergency-note" data-testid="emergency-data-pending"><CircleAlert size={17} /><span><b>Emergency hospital data is not connected yet.</b> Nearest emergency-ready hospitals, ICU beds and contacts will appear here once verified data is supplied by hospitals. Nothing here is estimated.</span></div>
    {triage && <p className="triage-disclaimer" data-testid="emergency-disclaimer"><ShieldCheck size={13} /> {triage.disclaimer}</p>}
    <Link to="/lookup" className="directions-link" data-testid="emergency-back-link"><ArrowLeft size={15} /> Back to patient lookup</Link>
  </main>;
}
