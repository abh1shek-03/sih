import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Ambulance, ArrowLeft, BedDouble, ChevronDown, CircleAlert, MapPin, Phone, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { fetchAllStatus } from "@/lib/hospitalStatus";

function EmergencyHospitalCard({ hospital, icuWard }) {
  const [open, setOpen] = useState(false);
  const icuTeaser = icuWard
    ? `ICU ${icuWard.available}/${icuWard.total} · ${icuWard.confirmed ? "hospital-confirmed" : "demo baseline"}`
    : `ICU: ${hospital.emergency.icuBeds ?? "Not publicly reported"}`;
  const phoneTeaser = hospital.emergency.phone || "Contact pending";
  return (
    <div className={`emergency-hospital-card compact ${open ? "open" : ""}`} data-testid={`emergency-hospital-${hospital.id}`}>
      <button type="button" className="emergency-hospital-head" onClick={() => setOpen(!open)} aria-expanded={open} data-testid={`emergency-hospital-expand-${hospital.id}`}>
        <span className="emergency-hospital-idn">
          <h3>{hospital.name}</h3>
          <span className="muted"><MapPin size={12} /> {hospital.location.area} · {icuTeaser} · {phoneTeaser}</span>
        </span>
        <ChevronDown size={16} className={`chevron-inline ${open ? "rotated" : ""}`} />
      </button>
      {open && (
        <div className="emergency-hospital-body">
          {hospital.address && <p className="muted"><MapPin size={13} /> {hospital.address}</p>}
          <div className="emergency-hospital-facts">
            {icuWard ? (
              <span data-testid={`emergency-icu-live-${hospital.id}`}>
                <BedDouble size={14} /> ICU: {icuWard.available}/{icuWard.total} available
                <em className={icuWard.confirmed ? "icu-confirmed" : "icu-demo"}>{icuWard.confirmed ? "hospital-confirmed" : "demo baseline"}</em>
              </span>
            ) : (
              <span><BedDouble size={14} /> ICU: {hospital.emergency.icuBeds ?? "Not publicly reported"}</span>
            )}
          </div>
          <p className="emergency-hospital-note">{hospital.emergency.notes}</p>
          <div className="emergency-hospital-actions">
            {hospital.emergency.phone && (
              <a href={`tel:${hospital.emergency.phone.split(" ")[0].split("/")[0]}`} data-testid={`emergency-call-hospital-${hospital.id}`}>
                <Phone size={13} /> {hospital.emergency.phone}
              </a>
            )}
            {hospital.emergency.ambulance && (
              <a href={`tel:${hospital.emergency.ambulance}`} data-testid={`emergency-ambulance-${hospital.id}`}>
                <Ambulance size={13} /> {hospital.emergency.ambulance}
              </a>
            )}
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospital.name + " " + hospital.location.area + " Patiala")}`} target="_blank" rel="noreferrer" data-testid={`emergency-directions-${hospital.id}`}>
              <MapPin size={13} /> Directions
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Emergency() {
  const { state } = useLocation();
  const triage = state?.triage;
  const emergencyHospitals = api.getEmergencyReadyHospitals();
  const [statusMap, setStatusMap] = useState({});
  useEffect(() => {
    fetchAllStatus(emergencyHospitals.map(h => h.id)).then(setStatusMap).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <main className="emergency-page page-wrap" data-testid="smart-emergency-screen">
      <div className="emergency-banner">
        <span className="emergency-mark"><Ambulance size={26} /></span>
        <div>
          <p className="eyebrow emergency-eyebrow">SMART EMERGENCY</p>
          <h1>This may need<br /><em>immediate care.</em></h1>
        </div>
      </div>
      {triage && (
        <div className="emergency-card">
          <p className="emergency-text" data-testid="emergency-response-text">{triage.responseText}</p>
          {state?.input && <small className="muted">You wrote: “{state.input}”</small>}
        </div>
      )}
      <div className="emergency-actions">
        <a className="button emergency-call" href="tel:108" data-testid="emergency-call-108"><Phone size={18} /> Call 108 · Ambulance</a>
        <a className="button emergency-call secondary" href="tel:112" data-testid="emergency-call-112"><Phone size={18} /> Call 112 · Emergency</a>
      </div>
      {triage && (
        <p className="triage-disclaimer" data-testid="emergency-disclaimer">
          <ShieldCheck size={13} /> {triage.disclaimer}
        </p>
      )}
      <div className="emergency-hospitals" data-testid="emergency-hospital-list">
        <p className="eyebrow emergency-eyebrow">NEARBY EMERGENCY-READY HOSPITALS</p>
        <p className="muted emergency-list-note">Tap a hospital to see ICU numbers, ambulance line and directions. Always call before travelling.</p>
        <div className="emergency-hospital-grid">
          {emergencyHospitals.map(h => {
            const icuWard = statusMap[h.id]?.wards?.find(w => w.id === "icu");
            return <EmergencyHospitalCard key={h.id} hospital={h} icuWard={icuWard} />;
          })}
        </div>
        <div className="emergency-note" data-testid="emergency-data-pending">
          <CircleAlert size={17} />
          <span><b>ICU counts update live from each hospital's console.</b> Demo-baseline numbers are a starting point staff can override, not a hospital-confirmed real-time count — always call before travelling.</span>
        </div>
      </div>
      <Link to="/lookup" className="directions-link" data-testid="emergency-back-link">
        <ArrowLeft size={15} /> Back to patient lookup
      </Link>
    </main>
  );
}
