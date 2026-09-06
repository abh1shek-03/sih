import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Ambulance, ArrowLeft, BedDouble, CircleAlert, MapPin, Phone, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { fetchAllStatus } from "@/lib/hospitalStatus";

export default function Emergency() {
  const { state } = useLocation();
  const triage = state?.triage;
  const emergencyHospitals = api.getEmergencyReadyHospitals();
  const [statusMap, setStatusMap] = useState({});
  useEffect(() => { fetchAllStatus(emergencyHospitals.map(h => h.id)).then(setStatusMap).catch(() => {}); }, []);
  return <main className="emergency-page page-wrap" data-testid="smart-emergency-screen">
    <div className="emergency-banner"><span className="emergency-mark"><Ambulance size={26} /></span><div><p className="eyebrow emergency-eyebrow">SMART EMERGENCY</p><h1>This may need<br /><em>immediate care.</em></h1></div></div>
    {triage && <div className="emergency-card"><p className="emergency-text" data-testid="emergency-response-text">{triage.responseText}</p>{state?.input && <small className="muted">You wrote: “{state.input}”</small>}</div>}
    <div className="emergency-actions">
      <a className="button emergency-call" href="tel:108" data-testid="emergency-call-108"><Phone size={18} /> Call 108 · Ambulance</a>
      <a className="button emergency-call secondary" href="tel:112" data-testid="emergency-call-112"><Phone size={18} /> Call 112 · Emergency</a>
    </div>
    {triage && <p className="triage-disclaimer" data-testid="emergency-disclaimer"><ShieldCheck size={13} /> {triage.disclaimer}</p>}
    <div className="emergency-hospitals" data-testid="emergency-hospital-list">
      <p className="eyebrow emergency-eyebrow">NEARBY EMERGENCY-READY HOSPITALS</p>
      <p className="muted emergency-list-note">ICU numbers marked "hospital-confirmed" come from the hospital's own figures; others are a live staff-updated demo baseline until the hospital confirms — call before travelling either way.</p>
      <div className="emergency-hospital-grid">
        {emergencyHospitals.map(h => { const icuWard = statusMap[h.id]?.wards?.find(w => w.id === "icu"); return <div className="emergency-hospital-card" key={h.id} data-testid={`emergency-hospital-${h.id}`}>
          <h3>{h.name}</h3>
          {h.address && <p className="muted"><MapPin size={13} /> {h.address}</p>}
          <div className="emergency-hospital-facts">
            {icuWard ? <span data-testid={`emergency-icu-live-${h.id}`}><BedDouble size={14} /> ICU: {icuWard.available}/{icuWard.total} available <em className={icuWard.confirmed ? "icu-confirmed" : "icu-demo"}>{icuWard.confirmed ? "hospital-confirmed" : "demo baseline"}</em></span> : <span><BedDouble size={14} /> ICU: {h.emergency.icuBeds ?? "Not publicly reported"}</span>}
          </div>
          <p className="emergency-hospital-note">{h.emergency.notes}</p>
          <div className="emergency-hospital-actions">
            {h.emergency.phone && <a href={`tel:${h.emergency.phone.split(" ")[0].split("/")[0]}`} data-testid={`emergency-call-hospital-${h.id}`}><Phone size={13} /> {h.emergency.phone}</a>}
            {h.emergency.ambulance && <a href={`tel:${h.emergency.ambulance}`} data-testid={`emergency-ambulance-${h.id}`}><Ambulance size={13} /> {h.emergency.ambulance}</a>}
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name + " " + h.location.area + " Patiala")}`} target="_blank" rel="noreferrer" data-testid={`emergency-directions-${h.id}`}><MapPin size={13} /> Directions</a>
          </div>
        </div>; })}
      </div>
      <div className="emergency-note" data-testid="emergency-data-pending"><CircleAlert size={17} /><span><b>ICU counts update live from each hospital's console.</b> Demo-baseline numbers are a starting point staff can override, not a hospital-confirmed real-time count — always call before travelling.</span></div>
    </div>
    <Link to="/lookup" className="directions-link" data-testid="emergency-back-link"><ArrowLeft size={15} /> Back to patient lookup</Link>
  </main>;
}

