import { useEffect, useId, useState } from "react";
import { BrowserRouter, Link, Route, Routes, useNavigate } from "react-router-dom";
import { Activity, Ambulance, ArrowRight, BedDouble, Check, ChevronDown, CircleAlert, Clock3, Hospital, LogIn, MapPin, Menu, MessageSquareText, Phone, Search, ShieldCheck, Stethoscope, X } from "lucide-react";
import { api } from "@/lib/api";
import { getFirebaseMode } from "@/lib/firebase";
import { listAuthHospitals, login as loginApi, logout as logoutApi, me as meApi, registerStaff as registerApi } from "@/lib/auth";
import { admitWard, dischargeWard, fetchAllStatus, fetchStatus, setDoctorStatus } from "@/lib/hospitalStatus";
import { fetchAllPhotos, fetchVerifiedMap, removeHospitalPhoto, uploadHospitalPhoto } from "@/lib/hospitalPhotos";
import { createCallbackRequest } from "@/lib/callbacks";
import { SymptomTriage } from "@/components/SymptomTriage";
import Emergency from "@/pages/Emergency";
import "@/App.css";
import "@/data.css";

const statusText = { available: "Available", limited: "Limited", full: "Full", unknown: "Capacity unreported" };
function StatusPill({ status, label }) { const id = useId().replace(/:/g, ""); return <span data-testid={`status-pill-${status}-${id}`} className={`status-pill ${status}`}><span className="status-dot" />{label || statusText[status]}</span>; }
function Shell({ user, onConsole, children }) { const [open, setOpen] = useState(false); const navigate = useNavigate(); return <div className="app-shell"><header className="topbar"><Link to="/" className="brand" data-testid="brand-home-link"><span className="brand-mark"><Activity size={18} /></span><span>Medi<span>Connect</span></span></Link><button className="mobile-menu" onClick={() => setOpen(!open)} data-testid="mobile-menu-button"><Menu size={20} /></button><nav className={open ? "nav open" : "nav"} data-testid="main-navigation"><Link to="/lookup" data-testid="nav-patient-lookup">Patient lookup</Link><Link to="/console" data-testid="nav-hospital-console">Hospital console</Link><button className="nav-login" onClick={() => user ? navigate("/console") : onConsole()} data-testid="nav-staff-login"><LogIn size={15} /> {user ? user.hospitalName : "Staff sign in"}</button></nav></header>{children}<footer className="footer"><span>MediConnect</span><span>Care that finds you.</span><span className="demo-foot"><span className="live-dot" /> Demo data · unverified</span></footer></div>; }
function Home() { const navigate = useNavigate(); const hospitals = api.getHospitals(); const doctorTotal = hospitals.reduce((sum, h) => sum + h.doctors.length, 0); return <main className="home-page page-wrap"><section className="home-hero"><div className="hero-copy reveal"><p className="eyebrow"><span className="live-dot" /> Patiala care directory</p><h1>Find the right care<br /><em>before you go.</em></h1><p className="hero-lead">Compare hospitals, specialists, consultation fees, OPD hours, and directions from one calm view.</p><div className="hero-actions"><button className="button primary" onClick={() => navigate("/lookup")} data-testid="hero-find-care-button">Find care near you <ArrowRight size={17} /></button><button className="button text-button" onClick={() => navigate("/console")} data-testid="hero-staff-console-button">For hospital staff <span>↗</span></button></div></div><div className="hero-board reveal delay-1"><div className="board-head"><span>PATIALA DIRECTORY</span><span>{hospitals.length} hospitals listed</span></div><div className="signal"><div className="signal-icon"><Hospital size={26} /></div><div><strong>Hospital information, together</strong><p>Doctor profiles and timings from your supplied directory data</p></div><Check className="signal-check" size={18} /></div><div className="mini-stats"><div><strong>{hospitals.length}</strong><span>Hospitals</span></div><div><strong>{doctorTotal}+</strong><span>Doctors listed</span></div><div><strong>24/7</strong><span>Open hospitals</span></div></div><div className="board-note"><ShieldCheck size={15} /><span>Records are clearly marked unverified; availability stays unavailable until staff confirm it.</span></div></div></section><section className="home-strip"><div><span className="strip-number">01</span><strong>Search by hospital</strong><p>Compare care, fees, and OPD timings.</p></div><div><span className="strip-number">02</span><strong>Compare specialists</strong><p>Find doctors across every hospital.</p></div><div><span className="strip-number">03</span><strong>Choose with clarity</strong><p>Open directions before you travel.</p></div></section></main>; }
function HpRow({ icon, label, teaser, open, onToggle, testId, accent, children }) {
  return (
    <div className={`hp-row ${open ? "open" : ""} ${accent || ""}`} data-testid={testId}>
      <button type="button" className="hp-row-head" onClick={onToggle} aria-expanded={open}>
        <span className="hp-row-icon">{icon}</span>
        <span className="hp-row-text">
          <span className="hp-row-label">{label}</span>
          <span className="hp-row-teaser">{teaser}</span>
        </span>
        <ChevronDown size={16} className={`chevron-inline ${open ? "rotated" : ""}`} />
      </button>
      {open && <div className="hp-row-body">{children}</div>}
    </div>
  );
}

function buildSpecialtyLine(doc) {
  // A short, official-sounding one-line summary of the doctor's expertise.
  // Prefers the formal specialization; adds experience/designation when supplied.
  const parts = [doc.specialization];
  if (doc.designation) parts.push(doc.designation);
  if (doc.experience) parts.push(doc.experience);
  return parts.filter(Boolean).join(" · ");
}

function DoctorCollapsed({ doc, live, hospital, onRequestCallback }) {
  const [open, setOpen] = useState(false);
  const docStatus = live?.doctors?.[doc.id] || "unavailable";
  const isAvail = docStatus === "available";
  const initials = doc.name.split(" ").map(x => x[0]).slice(0, 2).join("");
  const specialtyLine = buildSpecialtyLine(doc);
  return (
    <li className={`doctor-collapsed ${open ? "open" : ""}`} data-testid={`doctor-collapsed-${doc.id}`}>
      <button type="button" className="doctor-collapsed-head" onClick={() => setOpen(!open)} data-testid={`doctor-expand-${doc.id}`} aria-expanded={open}>
        <span className="doctor-name-line">
          <span className="avatar small">{initials}</span>
          <span className="doctor-idn">
            <b>{doc.name}</b>
            <small className="doctor-specialty-line" data-testid={`doctor-specialty-line-${doc.id}`}>{specialtyLine}</small>
          </span>
        </span>
        <span className="doctor-collapsed-right">
          <StatusPill status={isAvail ? "available" : "full"} label={isAvail ? "Available" : "Unavailable"} />
          <ChevronDown size={15} className={`chevron-inline ${open ? "rotated" : ""}`} />
        </span>
      </button>
      {open && (
        <div className="doctor-collapsed-body" data-testid={`doctor-detail-${doc.id}`}>
          <div className="doc-field"><span className="doc-key">Specialty</span><span>{doc.specialization}</span></div>
          {doc.experience && <div className="doc-field"><span className="doc-key">Experience</span><span>{doc.experience}</span></div>}
          {doc.rating && <div className="doc-field"><span className="doc-key">Rating</span><span>{doc.rating}</span></div>}
          {doc.qualification && <div className="doc-field"><span className="doc-key">Qualification</span><span>{doc.qualification}</span></div>}
          {doc.designation && <div className="doc-field"><span className="doc-key">Designation</span><span>{doc.designation}</span></div>}
          {doc.expertise && <div className="doc-field"><span className="doc-key">Expertise</span><span>{doc.expertise}</span></div>}
          {!doc.qualification && !doc.designation && !doc.expertise && (
            <p className="hp-body muted">Profile details not publicly listed by the hospital.</p>
          )}
          <div className="doctor-actions">
            <button type="button" className="callback-btn" onClick={() => onRequestCallback(doc, hospital)} data-testid={`request-callback-${doc.id}`}>
              <Phone size={14} /> Request callback
            </button>
            <span className="doctor-actions-hint">The hospital will call you back — no need to dial.</span>
          </div>
          <p className="hp-body muted small-note">Availability shown as unavailable until the hospital confirms it.</p>
        </div>
      )}
    </li>
  );
}

function VerifiedBadge({ compact }) {
  return (
    <span className={`verified-badge ${compact ? "compact" : ""}`} data-testid="hospital-verified-badge" title="Hospital-verified: real photo uploaded and bed counts confirmed by staff">
      <ShieldCheck size={compact ? 12 : 14} />
      <span>Hospital-verified</span>
    </span>
  );
}

function HospitalCard({ hospital, selected, onSelect, live, photo, verified, onRequestCallback }) {
  const overallStatus = live?.overallStatus || hospital.overallStatus;
  const totalAvailable = live?.wards ? live.wards.reduce((s, w) => s + w.available, 0) : null;
  const totalCapacity = live?.wards ? live.wards.reduce((s, w) => s + w.total, 0) : null;
  const bedsSummary = live?.wards
    ? `${totalAvailable}/${totalCapacity} beds available`
    : (hospital.bedsTotal ? `${hospital.bedsTotal} total beds` : "Beds not reported");
  const specialtyCount = hospital.specialtiesList?.length || hospital.specialtyCount;
  const summaryLine = `${bedsSummary} · ${specialtyCount} specialit${specialtyCount === 1 ? "y" : "ies"} · ${hospital.doctorCount} doctors`;
  const [openRow, setOpenRow] = useState(null);
  const toggleRow = (k) => setOpenRow(openRow === k ? null : k);
  const specList = hospital.specialtiesList || [];
  const specTeaser = specList.length
    ? (specList.length > 3 ? `${specList.slice(0, 3).join(", ")} · +${specList.length - 3} more` : specList.join(", "))
    : "Not reported";
  const emergencyTeaser = hospital.emergency?.available
    ? `Emergency-ready${hospital.emergency.phone ? ` · ${hospital.emergency.phone}` : ""}`
    : "Not emergency-ready";
  const contactTeaser = (hospital.phone && hospital.phone !== "Hospital contact pending verification")
    ? hospital.phone
    : "Contact pending verification";
  const addressTeaser = hospital.address || `${hospital.location.area}, Patiala`;
  return (
    <article className={`hospital-card ${selected ? "selected" : ""}`} data-testid={`hospital-card-${hospital.id}`}>
      <button type="button" className="card-main compact" onClick={() => onSelect(hospital.id)} data-testid={`hospital-expand-${hospital.id}`}>
        <div className="card-top">
          <StatusPill status={overallStatus} label={`${statusText[overallStatus]} capacity`} />
          <span className="verified-tag">{live?.wards ? "STAFF-UPDATED" : "UNVERIFIED DEMO"}</span>
        </div>
        <h3 className="hospital-name-row">
          <span>{hospital.name}</span>
          {verified?.verified && <VerifiedBadge />}
        </h3>
        <p className="muted"><MapPin size={14} /> {hospital.location.area} · {hospital.type}</p>
        <p className="card-summary" data-testid={`hospital-summary-${hospital.id}`}>{summaryLine}</p>
        <ChevronDown size={17} className={`chevron ${selected ? "rotated" : ""}`} />
      </button>
      {selected && (
        <div className="card-detail" data-testid={`hospital-detail-${hospital.id}`}>
          {photo?.dataUrl ? (
            <div className="hospital-photo-wrap" data-testid={`hospital-photo-${hospital.id}`}>
              <img src={photo.dataUrl} alt={`${hospital.name} exterior — supplied by hospital staff`} className="hospital-photo" loading="lazy" />
              <span className="photo-caption verified">Photo supplied by {hospital.name} staff</span>
            </div>
          ) : (
            <div className="hospital-photo-empty" data-testid={`hospital-photo-empty-${hospital.id}`}>
              <div className="photo-empty-inner">
                <Hospital size={22} />
                <div>
                  <strong>Photo not yet supplied by the hospital</strong>
                  <span>MediConnect only shows a hospital's own photo — never a stock image. {hospital.name} staff can upload one from the Console.</span>
                </div>
              </div>
            </div>
          )}
          <HpRow icon={<MapPin size={16} />} label="Address & directions" teaser={addressTeaser} open={openRow === "addr"} onToggle={() => toggleRow("addr")} testId={`hp-row-addr-${hospital.id}`}>
            {hospital.address && <p className="hp-body">{hospital.address}</p>}
            {hospital.coords && (
              <div className="mini-map-wrap" data-testid={`hospital-map-${hospital.id}`}>
                <iframe title={`Map of ${hospital.name}`} className="mini-map" loading="lazy" src={`https://www.openstreetmap.org/export/embed.html?bbox=${hospital.coords.lng - 0.008}%2C${hospital.coords.lat - 0.005}%2C${hospital.coords.lng + 0.008}%2C${hospital.coords.lat + 0.005}&layer=mapnik&marker=${hospital.coords.lat}%2C${hospital.coords.lng}`} />
                <span className="map-caption">{hospital.coords.verified ? "Pinned from the hospital's official address" : "Approximate pin — confirm exact entrance on arrival"}</span>
              </div>
            )}
            <a className="directions-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospital.name + " " + hospital.location.area + " Patiala")}`} target="_blank" rel="noreferrer" data-testid={`hospital-directions-${hospital.id}`}>
              <MapPin size={15} /> Open directions in Google Maps <ArrowRight size={15} />
            </a>
          </HpRow>

          <HpRow icon={<Clock3 size={16} />} label="OPD hours" teaser={hospital.opd} open={openRow === "opd"} onToggle={() => toggleRow("opd")} testId={`hp-row-opd-${hospital.id}`}>
            <p className="hp-body">{hospital.opd}</p>
          </HpRow>

          <HpRow icon={<span className="hp-currency">₹</span>} label="Consultation fees" teaser={hospital.consultationFees} open={openRow === "fees"} onToggle={() => toggleRow("fees")} testId={`hp-row-fees-${hospital.id}`}>
            <p className="hp-body">{hospital.consultationFees}</p>
            {hospital.email && <p className="hp-body muted">Billing queries: {hospital.email}</p>}
          </HpRow>

          <HpRow icon={<BedDouble size={16} />} label="Wards & beds" teaser={bedsSummary} open={openRow === "beds"} onToggle={() => toggleRow("beds")} testId={`hp-row-beds-${hospital.id}`}>
            {live?.wards ? (
              <div className="ward-mini-list" data-testid={`hospital-ward-availability-${hospital.id}`}>
                {live.wards.map(w => <span key={w.id} className={`ward-mini ${w.status}`}>{w.name}: {w.available}/{w.total}</span>)}
              </div>
            ) : (
              <p className="hp-body not-reported">Not reported by hospital staff.</p>
            )}
          </HpRow>

          {specList.length > 0 && (
            <HpRow icon={<Activity size={16} />} label={`Specialities · ${specList.length}`} teaser={specTeaser} open={openRow === "spec"} onToggle={() => toggleRow("spec")} testId={`hp-row-spec-${hospital.id}`}>
              <div className="specialty-chips">
                {specList.map((s, i) => <span className="specialty-chip" key={i} data-testid={`specialty-chip-${hospital.id}-${i}`}>{s}</span>)}
              </div>
            </HpRow>
          )}

          <HpRow icon={<Stethoscope size={16} />} label={`Doctors · ${hospital.doctors.length}`} teaser="Tap a name to view the doctor's profile" open={openRow === "docs"} onToggle={() => toggleRow("docs")} testId={`hp-row-docs-${hospital.id}`}>
            <ul className="doctor-collapsed-list">
              {hospital.doctors.map(doc => <DoctorCollapsed key={doc.id} doc={doc} live={live} hospital={hospital} onRequestCallback={onRequestCallback} />)}
            </ul>
          </HpRow>

          {hospital.emergency?.available && (
            <HpRow icon={<CircleAlert size={16} />} label="Emergency" teaser={emergencyTeaser} open={openRow === "er"} onToggle={() => toggleRow("er")} testId={`hp-row-er-${hospital.id}`} accent="warn">
              <div data-testid={`hospital-emergency-info-${hospital.id}`}>
                <p className="hp-body">{hospital.emergency.notes}</p>
                {hospital.emergency.phone && <p className="hp-body"><b>Emergency line:</b> {hospital.emergency.phone}</p>}
                {hospital.emergency.ambulance && <p className="hp-body"><b>Ambulance:</b> {hospital.emergency.ambulance}</p>}
              </div>
            </HpRow>
          )}

          <HpRow icon={<Ambulance size={16} />} label="Contact" teaser={contactTeaser} open={openRow === "contact"} onToggle={() => toggleRow("contact")} testId={`hp-row-contact-${hospital.id}`}>
            {hospital.phone && <p className="hp-body"><b>Phone:</b> {hospital.phone}</p>}
            {hospital.email && <p className="hp-body"><b>Email:</b> {hospital.email}</p>}
            {!hospital.phone && !hospital.email && <p className="hp-body muted">Contact information pending verification.</p>}
          </HpRow>
        </div>
      )}
    </article>
  );
}

function DoctorSearchRow({ doc, hospitals, onRequestCallback }) {
  const [open, setOpen] = useState(false);
  const initials = doc.name.split(" ").map(x => x[0]).slice(0, 2).join("");
  const specialtyLine = buildSpecialtyLine(doc);
  const hospitalObj = hospitals.find(h => h.name === doc.hospital);
  return (
    <div className={`doctor-search ${open ? "open" : ""}`} data-testid={`doctor-result-${doc.id}`}>
      <button type="button" className="doctor-search-head" onClick={() => setOpen(!open)} aria-expanded={open} data-testid={`doctor-search-expand-${doc.id}`}>
        <span className="doctor-name-line">
          <span className="avatar">{initials}</span>
          <span className="doctor-search-idn">
            <b>{doc.name}</b>
            <small className="doctor-specialty-line" data-testid={`doctor-specialty-line-${doc.id}`}>{specialtyLine}</small>
            <small className="doctor-search-hospital">{doc.hospital}</small>
          </span>
        </span>
        <span className="doctor-search-right">
          <StatusPill status="full" label="Unavailable" />
          <ChevronDown size={15} className={`chevron-inline ${open ? "rotated" : ""}`} />
        </span>
      </button>
      {open && (
        <div className="doctor-search-body" data-testid={`doctor-search-detail-${doc.id}`}>
          <div className="doc-field"><span className="doc-key">Specialty</span><span>{doc.specialization}</span></div>
          {doc.experience && <div className="doc-field"><span className="doc-key">Experience</span><span>{doc.experience}</span></div>}
          {doc.rating && <div className="doc-field"><span className="doc-key">Rating</span><span>{doc.rating}</span></div>}
          {doc.qualification && <div className="doc-field"><span className="doc-key">Qualification</span><span>{doc.qualification}</span></div>}
          {doc.designation && <div className="doc-field"><span className="doc-key">Designation</span><span>{doc.designation}</span></div>}
          {doc.expertise && <div className="doc-field"><span className="doc-key">Expertise</span><span>{doc.expertise}</span></div>}
          <div className="doctor-actions">
            <button type="button" className="callback-btn" onClick={() => onRequestCallback(doc, hospitalObj)} data-testid={`request-callback-${doc.id}`}>
              <Phone size={14} /> Request callback
            </button>
            <span className="doctor-actions-hint">The hospital will call you back — no need to dial.</span>
          </div>
          <p className="hp-body muted small-note">Availability shown as unavailable until the hospital confirms it.</p>
        </div>
      )}
    </div>
  );
}

function CallbackModal({ context, onClose }) {
  const [patientName, setPatientName] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredTime, setPreferredTime] = useState("As soon as possible");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const submit = async () => {
    if (!patientName.trim() || patientName.trim().length < 2) { setError("Please enter your full name."); return; }
    if (!phone.trim() || phone.replace(/[^0-9+]/g, "").length < 7) { setError("Please enter a valid phone number."); return; }
    if (!context?.hospital?.id) { setError("Missing hospital reference."); return; }
    setLoading(true); setError("");
    try {
      const res = await createCallbackRequest({
        hospitalId: context.hospital.id,
        doctorId: context.doc?.id || null,
        doctorName: context.doc?.name || null,
        patientName: patientName.trim(),
        phone: phone.trim(),
        preferredTime,
        note: note.trim(),
      });
      setSuccess(res);
    } catch (e) {
      setError(e?.response?.data?.detail || "Couldn't send request. Please try again.");
    } finally { setLoading(false); }
  };
  return (
    <div className="modal-backdrop">
      <div className="login-modal callback-modal" role="dialog" data-testid="callback-modal">
        <button className="modal-close" onClick={onClose} data-testid="close-callback-modal"><X /></button>
        <div className="modal-icon"><Phone size={22} /></div>
        <p className="eyebrow">REQUEST CALLBACK</p>
        <h2>{success ? "Callback requested" : (context?.doc?.name ? `Reach ${context.doc.name}` : "Ask the hospital to call you")}</h2>
        <p className="muted">
          {success
            ? success.message
            : `${context?.hospital?.name || "The hospital"} will call the number you leave here — usually within a few hours.`}
        </p>
        {!success && (
          <>
            <label>Your name<input value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="e.g. Ravinder Kaur" data-testid="callback-name-input" /></label>
            <label>Phone number<input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98xxx xxxxx" data-testid="callback-phone-input" /></label>
            <label>Best time to call
              <select value={preferredTime} onChange={e => setPreferredTime(e.target.value)} data-testid="callback-time-select">
                <option>As soon as possible</option>
                <option>Within 2 hours</option>
                <option>Today evening</option>
                <option>Tomorrow morning</option>
                <option>This weekend</option>
              </select>
            </label>
            <label>Note (optional)<textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Anything the hospital should know before calling" rows={3} data-testid="callback-note-input" /></label>
            {error && <div className="login-message login-error" data-testid="callback-error">{error}</div>}
            <button className="button primary full" onClick={submit} disabled={loading} data-testid="callback-submit">
              {loading ? "Sending…" : "Send request"} <ArrowRight size={16} />
            </button>
          </>
        )}
        {success && (
          <button className="button primary full" onClick={onClose} data-testid="callback-close-success">Done</button>
        )}
        <span className="modal-foot"><ShieldCheck size={13} /> Your number is only shared with {context?.hospital?.name || "the hospital"}.</span>
      </div>
    </div>
  );
}
function Lookup() {
  const [mode, setMode] = useState("hospital");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("gursharan");
  const [statusMap, setStatusMap] = useState({});
  const [photoMap, setPhotoMap] = useState({});
  const [verifiedMap, setVerifiedMap] = useState({});
  const [callbackCtx, setCallbackCtx] = useState(null);
  const hospitals = api.getHospitals();
  const doctors = api.searchDoctors(query);
  const filtered = hospitals.filter(h => `${h.name} ${h.location.area}`.toLowerCase().includes(query.toLowerCase()));
  useEffect(() => {
    const ids = hospitals.map(h => h.id);
    fetchAllStatus(ids).then(setStatusMap).catch(() => {});
    fetchAllPhotos(ids).then(setPhotoMap).catch(() => {});
    fetchVerifiedMap(ids).then(setVerifiedMap).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const openCallback = (doc, hospital) => setCallbackCtx({ doc, hospital });
  return (
    <main className="lookup-page page-wrap">
      <div className="lookup-heading">
        <div>
          <p className="eyebrow">PATIENT LOOKUP <span className="demo-label">UNVERIFIED DIRECTORY</span></p>
          <h1>Where do you need care?</h1>
          <p className="muted intro">Search a hospital or find a specialist across Patiala.</p>
        </div>
        <div className="safety-note">
          <ShieldCheck size={17} /><span>Information is unverified.<br />Always confirm before travelling.</span>
        </div>
      </div>
      <div className="search-panel">
        <div className="segmented">
          <button className={mode === "hospital" ? "active" : ""} onClick={() => setMode("hospital")} data-testid="search-by-hospital-tab"><Hospital size={16} /> By hospital</button>
          <button className={mode === "doctor" ? "active" : ""} onClick={() => setMode("doctor")} data-testid="search-by-doctor-tab"><Stethoscope size={16} /> By doctor or specialty</button>
          <button className={mode === "symptoms" ? "active" : ""} onClick={() => setMode("symptoms")} data-testid="search-by-symptoms-tab"><MessageSquareText size={16} /> Describe symptoms</button>
        </div>
        {mode !== "symptoms" && (
          <div className="search-input-wrap">
            <Search size={19} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={mode === "hospital" ? "Search hospital or area" : "Search specialty or doctor name"} data-testid="patient-search-input" />
            {query && <button onClick={() => setQuery("")} data-testid="clear-search-button"><X size={16} /></button>}
          </div>
        )}
      </div>
      {mode === "symptoms" ? (
        <SymptomTriage onOpenHospital={(id) => { setSelected(id); setQuery(""); setMode("hospital"); }} />
      ) : mode === "hospital" ? (
        <>
          <div className="result-bar">
            <span><strong>{filtered.length}</strong> hospitals in directory</span>
            <span className="result-updated"><Clock3 size={14} /> Bed capacity updates live once staff confirm it</span>
          </div>
          <div className="results-grid">
            {filtered.map((hospital) => (
              <HospitalCard key={hospital.id} hospital={hospital} selected={selected === hospital.id} onSelect={setSelected} live={statusMap[hospital.id]} photo={photoMap[hospital.id]} verified={verifiedMap[hospital.id]} onRequestCallback={openCallback} />
            ))}
          </div>
          {filtered.length === 0 && <div className="empty-state" data-testid="no-hospital-results">No hospitals match that search.</div>}
        </>
      ) : (
        <div className="doctor-results">
          <div className="result-bar">
            <span><strong>{doctors.length}</strong> specialists across the directory</span>
            <span className="result-updated"><Clock3 size={14} /> Tap a doctor to view their profile</span>
          </div>
          <div className="doctor-search-list">
            {doctors.map(doc => <DoctorSearchRow key={doc.id} doc={doc} hospitals={hospitals} onRequestCallback={openCallback} />)}
            {doctors.length === 0 && <div className="empty-state" data-testid="no-doctor-results">No specialists match that search.</div>}
          </div>
        </div>
      )}
      {callbackCtx && <CallbackModal context={callbackCtx} onClose={() => setCallbackCtx(null)} />}
    </main>
  );
}
function Login({ onClose, onSuccess }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [hospitalId, setHospitalId] = useState("");
  const [hospitalOptions, setHospitalOptions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    listAuthHospitals().then(setHospitalOptions).catch(() => setHospitalOptions([]));
  }, []);
  const submitSignIn = async () => {
    if (!email || !password) { setError("Enter your email and password."); return; }
    setLoading(true); setError("");
    try {
      const user = await loginApi(email.trim(), password);
      onSuccess(user); onClose(); navigate("/console");
    } catch (e) {
      setError(e?.response?.data?.detail || "Incorrect email or password.");
    } finally { setLoading(false); }
  };
  const submitSignUp = async () => {
    if (!hospitalId) { setError("Pick your hospital from the list."); return; }
    if (!email || !password) { setError("Enter your email and choose a password."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setLoading(true); setError("");
    try {
      const user = await registerApi(email.trim(), password, hospitalId);
      onSuccess(user); onClose(); navigate("/console");
    } catch (e) {
      setError(e?.response?.data?.detail || "Couldn't create your account. Please try again.");
    } finally { setLoading(false); }
  };
  const isSignUp = tab === "signup";
  const submit = isSignUp ? submitSignUp : submitSignIn;
  return (
    <div className="modal-backdrop">
      <div className="login-modal" role="dialog" data-testid="staff-login-modal">
        <button className="modal-close" onClick={onClose} data-testid="close-login-button"><X /></button>
        <div className="modal-icon"><ShieldCheck size={22} /></div>
        <p className="eyebrow">HOSPITAL STAFF</p>
        <div className="auth-tabs">
          <button type="button" className={!isSignUp ? "active" : ""} onClick={() => { setTab("signin"); setError(""); }} data-testid="auth-signin-tab">Sign in</button>
          <button type="button" className={isSignUp ? "active" : ""} onClick={() => { setTab("signup"); setError(""); }} data-testid="auth-signup-tab">Create account</button>
        </div>
        <h2>{isSignUp ? "Create your staff account" : "Sign in to your console"}</h2>
        <p className="muted">
          {isSignUp
            ? "Pick your hospital and choose your own email + password. Only you (and colleagues you tell) will know these credentials."
            : "Use the email and password you registered with. Each hospital's staff can only update their own hospital's beds and doctors."}
        </p>
        {isSignUp && (
          <label>Your hospital
            <select value={hospitalId} onChange={e => setHospitalId(e.target.value)} data-testid="signup-hospital-select">
              <option value="">Pick your hospital…</option>
              {hospitalOptions.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </label>
        )}
        <label>Email address
          <input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} placeholder={isSignUp ? "you@yourhospital.in" : "you@yourhospital.in"} data-testid="staff-email-input" autoComplete="email" />
        </label>
        <label>Password
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} placeholder={isSignUp ? "At least 8 characters" : "Your password"} data-testid="staff-password-input" autoComplete={isSignUp ? "new-password" : "current-password"} />
        </label>
        {isSignUp && (
          <label>Confirm password
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} placeholder="Repeat your password" data-testid="staff-confirm-input" autoComplete="new-password" />
          </label>
        )}
        {error && <div className="login-message login-error" data-testid="login-message">{error}</div>}
        <button className="button primary full" onClick={submit} disabled={loading} data-testid={isSignUp ? "staff-signup-submit" : "staff-login-submit"}>
          {loading ? (isSignUp ? "Creating…" : "Signing in…") : (isSignUp ? "Create account & sign in" : "Continue to console")} <ArrowRight size={16} />
        </button>
        <span className="modal-foot"><ShieldCheck size={13} /> {isSignUp ? "Only you know these credentials — MediConnect does not create staff logins for you." : "Role access is set at registration."}</span>
      </div>
    </div>
  );
}
function HospitalPhotoUploader({ hospitalId, hospitalName }) {
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    fetchAllPhotos([hospitalId]).then((map) => setPhoto(map[hospitalId] || null)).catch(() => {});
  }, [hospitalId]);
  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/^image\/(jpe?g|png|webp)$/i.test(file.type)) {
      setError("Only JPEG, PNG or WebP images are accepted."); return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError("Image is larger than 3 MB — please compress and try again."); return;
    }
    setLoading(true); setError("");
    try {
      const res = await uploadHospitalPhoto(hospitalId, file);
      setPhoto({ dataUrl: res.dataUrl, uploadedAt: res.uploadedAt, verified: true });
    } catch (err) {
      setError(err?.response?.data?.detail || "Couldn't upload the photo. Please try again.");
    } finally { setLoading(false); }
  };
  const onRemove = async () => {
    if (!window.confirm(`Remove the current photo of ${hospitalName}? Patients will see the "not yet supplied" placeholder again.`)) return;
    setLoading(true); setError("");
    try {
      await removeHospitalPhoto(hospitalId);
      setPhoto(null);
    } catch (err) {
      setError(err?.response?.data?.detail || "Couldn't remove the photo. Please try again.");
    } finally { setLoading(false); }
  };
  return (
    <div className="profile-card photo-uploader" data-testid="hospital-photo-uploader">
      <span className="label">Hospital photo</span>
      <p className="muted uploader-note">MediConnect never uses stock photos. Upload a real photo of {hospitalName}'s entrance or building — patients will see this exact image on the hospital's card.</p>
      {photo?.dataUrl ? (
        <div className="uploader-preview">
          <img src={photo.dataUrl} alt={`${hospitalName} exterior`} className="uploader-preview-img" />
          <span className="photo-caption verified">Currently live · uploaded {new Date(photo.uploadedAt).toLocaleDateString()}</span>
        </div>
      ) : (
        <div className="uploader-empty">
          <Hospital size={20} />
          <span>No photo uploaded yet. Patients see a "not yet supplied" placeholder.</span>
        </div>
      )}
      <div className="uploader-actions">
        <label className="button primary uploader-btn" data-testid="hospital-photo-upload-label">
          {loading ? "Uploading…" : (photo?.dataUrl ? "Replace photo" : "Upload photo")}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} disabled={loading} data-testid="hospital-photo-input" style={{ display: "none" }} />
        </label>
        {photo?.dataUrl && (
          <button type="button" className="button text-button uploader-remove" onClick={onRemove} disabled={loading} data-testid="hospital-photo-remove">Remove</button>
        )}
      </div>
      <p className="muted uploader-hint">JPEG, PNG or WebP · up to 3&nbsp;MB · a wide daylight shot of the entrance works best.</p>
      {error && <div className="login-message login-error" data-testid="hospital-photo-error">{error}</div>}
    </div>
  );
}

function Console({ user, onOpenLogin, onSignOut }) {
  const [active, setActive] = useState("wards");
  const hospitals = api.getHospitals();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const hospital = user ? hospitals.find(h => h.id === user.hospitalId) : null;
  const firebaseMode = getFirebaseMode();
  useEffect(() => { if (!user) return; setLoading(true); fetchStatus(user.hospitalId).then(setStatus).finally(() => setLoading(false)); }, [user]);
  const admit = (wardId) => admitWard(user.hospitalId, wardId).then(setStatus);
  const discharge = (wardId) => dischargeWard(user.hospitalId, wardId).then(setStatus);
  const toggleDoctor = (doctorId) => { const next = status?.doctors?.[doctorId] === "available" ? "unavailable" : "available"; setDoctorStatus(user.hospitalId, doctorId, next).then(setStatus); };
  if (!user) return <div className="console-gate page-wrap"><div className="gate-mark"><Hospital size={28} /></div><p className="eyebrow">HOSPITAL CONSOLE</p><h1>Keep your team<br /><em>in the know.</em></h1><p className="muted">Update the moments that matter. MediConnect derives capacity and availability automatically.</p><button className="button primary" onClick={onOpenLogin} data-testid="open-staff-login-button"><LogIn size={16} /> Staff sign in</button><div className="gate-status"><span className="demo-label">REAL LOGIN</span> {firebaseMode === "demo" ? "Each hospital signs in with its own email/password — no Firebase needed" : "Firebase connected"}</div></div>;
  return <main className="console-page"><aside className="console-sidebar"><div className="console-hospital"><div className="hospital-avatar"><Hospital size={21} /></div><div><strong data-testid="console-hospital-name">{hospital.name}</strong><small>{user.email}</small></div></div><nav><button className={active === "wards" ? "active" : ""} onClick={() => setActive("wards")} data-testid="console-wards-tab"><BedDouble size={17} /> Ward capacity</button><button className={active === "doctors" ? "active" : ""} onClick={() => setActive("doctors")} data-testid="console-doctors-tab"><Stethoscope size={17} /> Doctor roster</button><button className={active === "profile" ? "active" : ""} onClick={() => setActive("profile")} data-testid="console-profile-tab"><Hospital size={17} /> Hospital profile</button></nav><div className="sidebar-bottom"><div className="console-live"><span className="live-dot" /><div><b>Live · saved to database</b><small>Visible to patients immediately</small></div></div><button className="sign-out" onClick={onSignOut} data-testid="staff-sign-out">Sign out</button></div></aside><section className="console-content"><div className="console-top"><div><p className="eyebrow">STAFF WORKSPACE <span className="demo-label">SIGNED IN</span></p><h1>{active === "wards" ? "Ward capacity" : active === "doctors" ? "Doctor roster" : "Hospital profile"}</h1></div><div className="last-sync"><span className="live-dot" /> {loading ? "Syncing…" : "Live updates active"}</div></div>{active === "wards" && status && <><div className="console-alert"><CircleAlert size={17} /><span><b>Availability is derived automatically.</b> Admit or discharge patients — never edit available beds directly. Changes save to MediConnect's database and appear on Patient Lookup instantly.</span></div><div className="ward-list">{status.wards.map(ward => <div className="ward-row" key={ward.id} data-testid={`ward-row-${ward.id}`}><div className="ward-identity"><span className="ward-icon">{ward.id.slice(0, 3).toUpperCase()}</span><div><h3>{ward.name}</h3><span className="muted">{ward.total} total beds{!ward.confirmed && " · demo baseline"}</span></div></div><div className="capacity-readout"><strong>{ward.available}</strong><span>available</span><StatusPill status={ward.status} /></div><div className="stepper"><button onClick={() => admit(ward.id)} data-testid={`admit-${ward.id}`} aria-label={`Admit to ${ward.name}`}>−</button><span>Occupied {ward.total - ward.available}</span><button onClick={() => discharge(ward.id)} data-testid={`discharge-${ward.id}`} aria-label={`Discharge from ${ward.name}`}>+</button></div></div>)}</div><div className="derivation-note"><Activity size={17} /><div><b>Hospital status: <span className="green-text">{statusText[status.overallStatus]}</span></b><p>Based on the lowest capacity across {status.wards.length} wards · recalculated just now</p></div></div></>}{active === "doctors" && status && <div className="roster-list">{hospital.doctors.map(doc => { const docStatus = status.doctors?.[doc.id] === "available"; return <div className="roster-row" key={doc.id} data-testid={`roster-row-${doc.id}`}><div className="roster-person"><span className="avatar">{doc.name.split(" ").map(x => x[0]).join("")}</span><div><b>{doc.name}</b><small>{doc.specialization}</small></div></div><div className="roster-status"><StatusPill status={docStatus ? "available" : "full"} label={docStatus ? "Available" : "Unavailable"} /><small>{docStatus ? "Confirmed by staff" : "Default until confirmed"}</small></div><button className="status-toggle" onClick={() => toggleDoctor(doc.id)} data-testid={`toggle-doctor-${doc.id}`}>{docStatus ? "Mark unavailable" : "Mark available"}</button></div>; })}</div>}{active === "profile" && <div className="profile-grid"><div className="profile-card"><span className="label">Hospital name</span><h3>{hospital.name}</h3><span className="muted">{hospital.type} · {hospital.location.area}</span></div><div className="profile-card"><span className="label">Services</span><div className="service-list"><span><Ambulance size={15} /> Ambulance available</span><span><CircleAlert size={15} /> 24/7 emergency services</span><span><MapPin size={15} /> {hospital.phone}</span></div></div><HospitalPhotoUploader hospitalId={user.hospitalId} hospitalName={hospital.name} /></div>}</section></main>;
}
function App() { const [loginOpen, setLoginOpen] = useState(false); const [user, setUser] = useState(undefined); useEffect(() => { meApi().then(setUser); }, []); const signOut = () => { logoutApi(); setUser(null); }; return <BrowserRouter><Shell user={user} onConsole={() => setLoginOpen(true)}><Routes><Route path="/" element={<Home />} /><Route path="/lookup" element={<Lookup />} /><Route path="/console" element={<Console user={user} onOpenLogin={() => setLoginOpen(true)} onSignOut={signOut} />} /><Route path="/emergency" element={<Emergency />} /></Routes></Shell>{loginOpen && <Login onClose={() => setLoginOpen(false)} onSuccess={setUser} />}</BrowserRouter>; }
export default App;