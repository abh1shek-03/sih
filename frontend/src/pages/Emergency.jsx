import { Link, useLocation } from "react-router-dom";
import { Ambulance, ArrowLeft, BedDouble, CircleAlert, MapPin, Phone, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";

export default function Emergency() {
  const { state } = useLocation();
  const triage = state?.triage;
  const emergencyHospitals = api.getEmergencyReadyHospitals();
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
      <p className="muted emergency-list-note">Supplied by the hospitals themselves. ICU bed counts marked "Not publicly reported" are unverified — call before travelling.</p>
      <div className="emergency-hospital-grid">
        {emergencyHospitals.map(h => <div className="emergency-hospital-card" key={h.id} data-testid={`emergency-hospital-${h.id}`}>
          <h3>{h.name}</h3>
          {h.address && <p className="muted"><MapPin size={13} /> {h.address}</p>}
          <div className="emergency-hospital-facts">
            <span><BedDouble size={14} /> ICU: {h.emergency.icuBeds ?? "Not publicly reported"}</span>
          </div>
          <p className="emergency-hospital-note">{h.emergency.notes}</p>
          <div className="emergency-hospital-actions">
            {h.emergency.phone && <a href={`tel:${h.emergency.phone.split(" ")[0].split("/")[0]}`} data-testid={`emergency-call-hospital-${h.id}`}><Phone size={13} /> {h.emergency.phone}</a>}
            {h.emergency.ambulance && <a href={`tel:${h.emergency.ambulance}`} data-testid={`emergency-ambulance-${h.id}`}><Ambulance size={13} /> {h.emergency.ambulance}</a>}
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name + " " + h.location.area + " Patiala")}`} target="_blank" rel="noreferrer" data-testid={`emergency-directions-${h.id}`}><MapPin size={13} /> Directions</a>
          </div>
        </div>)}
      </div>
      <div className="emergency-note" data-testid="emergency-data-pending"><CircleAlert size={17} /><span><b>Bed availability is not live.</b> Contact details above are hospital-supplied and unverified in real time; capacities beyond what's listed are not estimated.</span></div>
    </div>
    <Link to="/lookup" className="directions-link" data-testid="emergency-back-link"><ArrowLeft size={15} /> Back to patient lookup</Link>
  </main>;
}
