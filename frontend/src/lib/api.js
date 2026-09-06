const doc = (name, specialization, extra = {}) => ({ name, specialization, ...extra });

const hospital = (id, name, type, area, fee, specialties, doctorCount, opd, doctors, extra = {}) => ({
  id, name, type, location: { area }, consultationFees: fee, specialtyCount: specialties, doctorCount, opd,
  overallStatus: "unknown", phone: extra.phone || "Hospital contact pending verification", ambulance: extra.ambulance || null,
  isSeedData: true, verificationStatus: "unverified", wards: [],
  address: extra.address || null, email: extra.email || null,
  specialtiesList: extra.specialtiesList || null, bedsTotal: extra.bedsTotal ?? null,
  emergency: extra.emergency || null,
  doctors: doctors.map((d, index) => ({ id: `${id}-d${index}`, ...d, status: "unavailable" })),
});

// Manipal Hospitals, Patiala — supplied official directory data
const manipalSpecialties = ["Accident & Emergency Care", "Anaesthesiology", "Bariatric Surgery", "Cardiology", "Cardiothoracic Vascular Surgery", "Cancer Care", "Dental Medicine", "Dermatology", "Diabetes & Endocrinology", "ENT", "Gastrointestinal Sciences", "General Surgery", "ICU & Critical Care", "Infectious Disease", "Internal Medicine", "Kidney Transplant", "Laboratory Medicine", "Neonatology & NICU", "Nephrology", "Neurology", "Neurosurgery", "Nutrition & Dietetics", "Obstetrics & Gynaecology", "Ophthalmology", "Orthopaedics", "Paediatrics & Child Care", "Paediatric Surgery", "Pain Medicine", "Physiotherapy", "Plastic, Reconstructive & Cosmetic Surgery", "Psychiatry", "Pulmonary Medicine", "Radiology", "Renal Sciences", "Rheumatology", "Spine Care", "Urology"];
const manipalDoctors = [
  doc("Dr. Bachan Lal Bharadwaj", "Internal Medicine", { qualification: "MBBS, MD (Internal Medicine)", experience: "30+ years", expertise: "Internal Medicine, Pulmonary Medicine, Cardiology-related care", source: "Official Manipal Hospitals profile" }),
  doc("Dr. Manuj Wadhwa", "Orthopaedics & Joint Replacement Surgery", { qualification: "MBBS, MS Ortho, MCh (UK)", experience: "20+ years", expertise: "Knee, hip, shoulder and elbow replacement; trauma reconstruction; sports injuries; arthroscopy; spine surgery; deformity correction" }),
  doc("Dr. Anurag Jindal", "Medical Gastroenterology", { qualification: "MBBS, MD, DM (Gastroenterology)", experience: "14+ years", expertise: "Gastroenterology, hepatology, GI disorders, ERCP, UGIE, colonoscopy, endoscopy, EUS, liver diseases, hepatitis B, pancreatic diseases, IBD" }),
  doc("Dr. Yogesh Garg", "Urology", { qualification: "MBBS, MS, MCh (Urology)", experience: "8+ years", expertise: "Endourology, paediatric urology, open & laparoscopic surgery, genital & urethral surgery, female urology, kidney/ureteric stones, prostate diseases" }),
  doc("Dr. Navdeep Kaur", "Dermatology & Cosmetology", { qualification: "MBBS, MD", experience: "14+ years", expertise: "Clinical dermatology, cosmetic & aesthetic dermatology, laser dermatology, skin, hair & nail disorders" }),
  doc("Dr. Neeraj Arora", "Paediatrics & Neonatology", { qualification: "MBBS, MD", experience: "10+ years", expertise: "Preterm newborn care, general paediatrics, neonatology, infectious diseases, vaccinations" }),
];

// Park Hospital, Patiala — supplied official directory data
const parkSpecialties = ["Cardiac Sciences", "Neuro Sciences – Brain & Spine", "Renal Sciences & Kidney Transplant", "Gastro Sciences", "Cancer Care", "Orthopaedics, Joint Replacement & Sports Medicine", "General & Laparoscopic Surgery", "Obstetrics & Gynaecology", "Bone Marrow Transplant", "Internal Medicine & Geriatric", "Bariatric Surgery", "Chest & Respiratory Diseases", "Critical Care", "Fertility Management", "Paediatrics", "Paediatric Surgery", "Plastic & Cosmetic Surgery", "Anaesthesiology", "Blood Bank", "Dental Care", "Dermatology", "Endocrinology", "ENT", "Interventional Radiology & Imaging", "Nuclear Medicine", "Ophthalmology", "Pathology & Microbiology", "Physiotherapy", "Psychiatry", "Rheumatology", "Robotic Surgeries"];
const parkDoctors = [
  doc("Dr. Sidharth Garg", "Cardiac Sciences"),
  doc("Dr. Harsimranjit Singh", "Cardiac Sciences", { qualification: "MBBS, MD, DM Cardiology", expertise: "Coronary angiography, PTCA, primary PTCA, complex PTCA, pacing and intensive cardiac care" }),
  doc("Dr. (Major) Gurjot Singh (Retd)", "General & Laparoscopic Surgery", { qualification: "MBBS, MS General Surgery", experience: "20+ years", expertise: "Advanced laparoscopic and open surgery, gallstones, hernia, appendicitis, piles/fissure, AV fistula and GI surgery" }),
  doc("Dr. Abhinav Sharma", "Psychiatry"),
  doc("Dr. Amarjit Singh", "Internal Medicine & Geriatric", { qualification: "MBBS, MD Medicine, DPM", experience: "18+ years", expertise: "Diabetes, encephalopathy, hypertension, acute heart failure, pneumonia, asthma, COPD, tuberculosis, severe gastritis" }),
  doc("Dr. Aparjot Singh", "Chest & Respiratory Diseases"),
  doc("Dr. Archit Latawa", "Neuro Sciences – Brain & Spine"),
  doc("Dr. Arshdeep Singh Sandhu", "Cardiac Sciences"),
  doc("Dr. Balvinder Kumar", "Internal Medicine & Geriatric"),
  doc("Dr. Bhavna Bhateja", "Obstetrics & Gynaecology"),
  doc("Dr. Deepankar Bansal", "Paediatrics"),
  doc("Dr. Harshita Kour", "Paediatrics"),
  doc("Dr. Hemant Ojha", "General & Laparoscopic Surgery"),
  doc("Dr. Himpreet Kaur", "Interventional Radiology & Imaging"),
  doc("Dr. Hitesh Kamal", "Renal Sciences & Kidney Transplant"),
  doc("Dr. Jaspreet Singh Khanna", "Critical Care"),
  doc("Dr. Malwinder Singh", "Orthopaedics, Joint Replacement & Sports Medicine"),
  doc("Dr. Navroop Kaur", "Interventional Radiology & Imaging"),
  doc("Dr. Pankaj Goyal", "Paediatrics"),
  doc("Dr. Parvinderjit Singh Kohli", "ENT", { qualification: "MBBS, MS (Otorhinolaryngology)", experience: "20+ years", expertise: "Endoscopic sinus surgery, head & neck surgery, ear surgeries, cochlear implant and BAHA surgeries, snoring & obstructive sleep apnea surgery", languages: "English, Hindi" }),
  doc("Dr. Prashant Marken", "Pathology & Microbiology"),
  doc("Dr. Rajat Sindwani", "Cardiac Sciences"),
  doc("Dr. Rajpreet Brar", "Gastroenterology", { qualification: "MBBS, MD Medicine, DM Gastroenterology", expertise: "Biliary stenting, pancreatic stenting, CBD stone removal, biopsy, biliary drainage and advanced ERCP" }),
  doc("Lt. Col. (Dr.) Raman Malhi", "Obstetrics & Gynaecology", { qualification: "MBBS, MD Obstetrics & Gynaecology, IVF Specialist", experience: "19+ years", expertise: "High-risk pregnancy, obstetric emergencies, gynaecological disorders/surgery, infertility/IVF and menopause" }),
  doc("Dr. Rishika Goel", "Anaesthesiology"),
  doc("Dr. Sarabjeet Singh", "Neuro Sciences – Brain & Spine", { qualification: "MBBS, MD Medicine, DNB Neurology", expertise: "Stroke, epilepsy, Parkinson's disease, migraine, autoimmune encephalitis, GBS, CIDP and movement disorders" }),
  doc("Dr. Shikha Garg", "Pathology & Microbiology"),
  doc("Dr. Shreya Gupta", "Dermatology"),
  doc("Dr. Sorabh Garg", "Orthopaedics, Joint Replacement & Sports Medicine", { qualification: "MBBS, MS Orthopaedics, FASM, FFAA", experience: "3+ years listed on current profile", expertise: "Knee, hip and shoulder replacement, arthroscopy, sports injuries, trauma/polytrauma and foot & ankle conditions" }),
  doc("Dr. Yogita Sharma", "Renal Sciences & Kidney Transplant"),
  doc("Dr. Gurkirat Kaur", "Anaesthesiology"),
  doc("Dr. Sujeet Prakash", "Ophthalmology"),
];

// Rajindra Hospital, Patiala (Government Medical College) — supplied official directory data
const rajindraSpecialties = ["Anaesthesiology & Critical Care", "Cardiology & ICCU", "ENT", "Ophthalmology", "Radiodiagnosis & Imaging", "Radiotherapy", "Paediatric Surgery", "Transfusion Medicine & Immuno-Hematology", "Clinical Hematology", "Psychiatry & De-addiction", "Dermatology & STD", "Internal Medicine", "Urology", "Neurology", "Orthopaedics & Joint Replacement", "General & Laparoscopic Surgery", "Obstetrics & Gynaecology", "Paediatrics", "Plastic Surgery", "Surgical Oncology", "TB & Chest Diseases"];
const rajindraDoctors = [
  ...["Dr. Anand Aggarwal", "Dr. Rajinder Singh", "Dr. Amit Chopra", "Dr. Chiman Lal", "Dr. Manpreet Kaur", "Dr. Talvir Sidhu", "Dr. Indu", "Dr. Divjot Kaur", "Dr. Monika Kharbanda", "Dr. Veer Davinder Singh"].map(n => doc(n, "Ophthalmology")),
  ...["Dr. Girish Sahni", "Dr. Amandeep Singh", "Dr. Jagdeep Singh Rehncy", "Dr. Harjit K. Singh Chawla", "Dr. Daljinder Singh", "Dr. Arvind Kumar", "Dr. Jaspreet Singh", "Dr. Nitish Bansal", "Dr. Kuldip Singh Sandhu", "Dr. Ranbir Singh", "Dr. Dharminder Singh", "Dr. Mahesh Goyal"].map(n => doc(n, "Orthopaedics")),
  doc("Dr. Sanjeev Bhagat", "ENT", { designation: "Professor & Head", expertise: "Cochlear implants, endoscopic ENT, major ear/nose/throat/head & neck surgeries, emergency ENT procedures" }),
  ...["Dr. Dimple Sahni", "Dr. Dinesh Kumar Sharma", "Dr. Parvinder Singh", "Dr. Vishav Yadav", "Dr. Ravinder Singh", "Dr. Prasun Kumar Chattopadhya"].map(n => doc(n, "ENT")),
  ...["Dr. Baljinder Kaur", "Dr. Harjinder Singh", "Dr. Manpreet Kaur", "Dr. Arun Mahajan", "Dr. Surinder Kaur", "Dr. Tanya Thakkar", "Dr. Amanadeep Kaur", "Dr. Manish Arora"].map(n => doc(n, "Paediatrics")),
  doc("Dr. Jaswir Singh", "Paediatric Surgery", { designation: "Professor & Head" }),
  ...["Dr. Ravi Kumar Garg", "Dr. Teg Rabab Singh", "Dr. Sukhrit Singh Shah"].map(n => doc(n, "Paediatric Surgery")),
  ...["Dr. Manoj Mathur", "Dr. Saryu Gupta", "Dr. Simmi Bhatnagar", "Dr. Naresh Kumar", "Dr. Rajesh Kumar Badhan", "Dr. Amita", "Dr. Gurpreet Singh Sandhu", "Dr. Amanjeet Kaur", "Dr. Parminder Kaur", "Dr. Sarita"].map(n => doc(n, "Radiodiagnosis & Imaging")),
  doc("Dr. Bharat Bhushan", "TB & Chest Diseases", { designation: "Professor & Head-cum-Deputy Medical Superintendent" }),
  ...["Dr. Vishal Chopra", "Dr. Kranti Garg", "Dr. Jawahar Lal Joshi", "Dr. Sudesh Kumari", "Dr. Jasvir Kaur"].map(n => doc(n, "TB & Chest Diseases")),
  ...["Dr. Harbhupinder Singh", "Dr. Suparana Sharma"].map(n => doc(n, "Urology")),
  doc("Dr. Anubha Garg", "Surgical Oncology"),
  doc("Dr. Dimple Chopra", "Dermatology & STD", { designation: "Professor & Head", expertise: "Dermatology OPD, leprosy clinic, psoriasis clinic, STD clinic, indoor and emergency services, telemedicine" }),
];

// AAS Medicare, Patiala — supplied official directory data
const aasSpecialties = ["Sports Medicine & Arthroscopy", "Preventive Clinical Cardiology", "Arthroplasty", "General Surgery", "Laparoscopic Surgery", "Spine Surgery", "Neurology", "Cosmetic Surgery & Hair Transplant", "ICU", "Urology", "ENT Surgery", "24-Hour Emergency"];
const aasDoctors = [
  doc("Dr. Sethi Manish", "Joint & Sport Injury Specialist", { qualification: "MBBS, DNB (Ortho)" }),
  doc("Dr. Madhvi Arora Sethi", "IVF & Laparoscopy Specialist", { qualification: "MBBS, MS, FMAS" }),
  doc("Dr. Sudhir Gupta", "Spine Specialist", { qualification: "MS, M.Ch." }),
  doc("Dr. Aditya Duggal", "Neurologist", { qualification: "DM (Neurology)" }),
  doc("Dr. Salvinder Singh Toor", "Consultant Brain & Spine Surgeon", { qualification: "M.Ch. Neurosurgery" }),
];

// Patiala Heart Institute & Multispeciality Hospital — supplied official directory data
const heartSpecialties = ["Clinical Cardiology", "Interventional Cardiology", "Cardiothoracic & Vascular Surgery", "General & Laparoscopic Surgery", "Nephrology", "Critical & Intensive Care", "Neurology", "Pulmonary Medicine", "Internal Medicine", "Gastroenterology & Hepatology", "ENT", "Laboratory", "Radiology", "Emergency & Ambulance", "Diabetes", "Physiotherapy & Rehabilitation", "Orthopaedics", "Robotic Knee Replacement Surgery"];
const heartDoctors = [
  doc("Dr. Gurpreet Singh Sidhu", "Cardiology", { qualification: "MD, DM (Cardiology)", designation: "Former Professor & Head of Cardiology, Government Medical College, Patiala" }),
  doc("Dr. Manmohan Singh", "Cardiology", { qualification: "MD, DM (Cardiology)", designation: "Former Professor & Head, Department of Cardiology, Government Medical College, Patiala" }),
  doc("Dr. Simarjot Singh Sarin", "Interventional Cardiology", { qualification: "MD, DM (Cardiology)", designation: "Senior Consultant Interventional Cardiologist" }),
  doc("Dr. Birdevinder Singh", "Interventional Cardiology", { qualification: "MD, DM (Cardiology)", designation: "Senior Consultant Interventional Cardiologist" }),
  doc("Dr. Rajinder Kumar Goyal", "General Surgery & Laparoscopy", { qualification: "MBBS, MS (General Surgery), FIAGES, FAIS", designation: "Senior Consultant General Surgery & Laparoscopy" }),
  doc("Dr. Gurdarshan Singh", "Interventional Cardiology", { qualification: "MD, DM (Cardiology)", designation: "Consultant Interventional Cardiologist" }),
  doc("Dr. Dharamvir Gandhi", "Medicine", { qualification: "MD (Medicine)", designation: "Previously Senior Lecturer, Department of Cardiology, Government Medical College, Patiala" }),
  doc("Dr. Sukhjot Singh Sidhu", "Orthopaedics", { qualification: "MS (Ortho)", designation: "Senior Consultant, Trauma & Joint Replacement Surgeon" }),
  doc("Dr. Shashi Jindal", "Cardiothoracic Surgery", { qualification: "MS, MCh (CTVS)", designation: "Previously at AIIMS New Delhi, PGI Chandigarh, Escorts Heart Institute New Delhi" }),
  doc("Dr. SPS Bagga", "Cardiothoracic Surgery", { qualification: "MS, MCh, FIACS", designation: "Previously Professor & Head of Cardiothoracic Surgery, Government Medical College, Patiala" }),
  doc("Dr. Harbir Kaur Rao", "Medicine", { qualification: "MD (Medicine)", designation: "Previously Professor & Head, Department of Medicine, Government Medical College, Patiala" }),
  doc("Dr. RS Gupta", "Medicine", { qualification: "MD (Medicine)", designation: "Previously Professor of Medicine" }),
  doc("Dr. Harbans Lal Bansal", "Medicine", { qualification: "MD (Medicine)", designation: "Previously Professor of Medicine" }),
  doc("Dr. Ankush PM", "Medicine"),
  doc("Dr. Sunil Arya", "Gastroenterology", { qualification: "MD (Medicine), DM (Gastro), PGI Chandigarh", designation: "Previously Registrar, DMCH Ludhiana" }),
  doc("Dr. Harbagh Singh", "Neurology", { qualification: "MD (Medicine), DM (Neurology)" }),
  doc("Dr. Amit Gupta", "Chest Medicine", { qualification: "MD, DNB, Fellow Critical Care" }),
  doc("Dr. Manminder Kaur", "Neurology", { qualification: "MD, DM (Neurology)" }),
  doc("Dr. B. P. Singh", "Urology & Andrology", { qualification: "MS, MCh Urology (AIIMS Delhi)", designation: "Senior Consultant – Urology & Andrology" }),
  doc("Dr. Tejinder Singh Sran", "Critical Care", { qualification: "MBBS, MD (Anaesthesiology), IDCCM", designation: "Consultant – Critical Care" }),
  doc("Dr. Salvinder Singh Toor", "Neurosurgery & Spine Surgery", { qualification: "MBBS, MS, MCh (Neurosurgery)", designation: "Consultant Neurosurgeon & Spine Surgeon" }),
  doc("Dr. Biswajit Maharana", "Anaesthesia", { qualification: "MD (Anaesthesia), PDCC (Cardiac Anaesthesia)", designation: "Previously at Escorts Heart Institute, SGPGI Lucknow" }),
  doc("Dr. M.J. Jayakanth", "Medicine", { qualification: "MD (Medicine), FRCP (Glasg)" }),
  doc("Dr. Deepak Aggarwal", "Radiology", { qualification: "MBBS, MD", designation: "Consultant Radiologist" }),
  doc("Dr. Naveen Jindal", "Anaesthesiology & Critical Care", { qualification: "MD", designation: "Anesthesiologist & Intensivist" }),
  doc("Dr. Gurpreet Kaur", "Physiotherapy"),
];

const hospitals = [
  hospital("gursharan", "Gursharan Hospital", "Multi-speciality Hospital", "Tripri", "₹200 - ₹600", 2, 2, "Open 24x7", [
    { name: "Dr. Rav Sharan", specialization: "General Physician", experience: "17 years", rating: "93% · 818 Patient Stories" },
    { name: "Dr. Dinkar Sood", specialization: "Plastic Surgeon", experience: "18 years", rating: "4.5 · 681 rated" },
  ]),
  hospital("manipal-patiala", "Manipal Hospitals, Patiala", "Multispecialty Hospital", "Patiala", "₹0 - ₹500", manipalSpecialties.length, manipalDoctors.length, "Open 24x7", manipalDoctors, {
    address: "Bhupindra Road, Near 22 No. Phatak, Patiala, Punjab – 147001", phone: "0175-500-0222", email: "info@manipalhospitals.com",
    specialtiesList: manipalSpecialties,
    emergency: { available: true, phone: "0175-500-0222", icuBeds: null, notes: "24×7 Accident & Emergency Care; critical-care support available through Manipal Hospitals' emergency services." },
  }),
  hospital("park-patiala", "Park Hospital", "Multispecialty Hospital", "Urban Estate", "Not provided", parkSpecialties.length, parkDoctors.length, "OPD 9:00 AM – 8:00 PM · Emergency 24×7", parkDoctors, {
    address: "Urban Estate, Phase-1, Opp. New Bus Stand, Patiala, Punjab", phone: "+91-7448000000", email: "info@parkhospital.in",
    specialtiesList: parkSpecialties, bedsTotal: "300+ (ICU: 65+)",
    emergency: { available: true, phone: "+91-7448000000", icuBeds: 65, notes: "24×7 Emergency, 24×7 Trauma Care and Critical Care available." },
  }),
  hospital("simran-ent", "Simran ENT Centre", "Ear-Nose-Throat (ENT) Hospital", "Patiala", "₹150", 1, 1, "Open today · 8:00 AM - 8:00 PM", [{ name: "Dr. Harsimran Singh", specialization: "Ear-Nose-Throat (ENT) Specialist", experience: "20 years" }]),
  hospital("guru-eye", "Guru Teg Bahadur Eye Hospital", "Ophthalmology (Eye Doctor) Hospital", "Patiala City", "₹100", 1, 1, "Open today · 9:00 AM - 2:00 PM", [{ name: "Dr. Ashapritpal Kaur", specialization: "Ophthalmologist", experience: "16 years" }]),
  hospital("sanjivni", "Sanjivni Multyspeciality Hospital", "Consultant Physician Hospital", "Rajpura", "₹325", 3, 1, "Open today · 9:00 AM - 2:00 PM", [{ name: "Dr. Yogesh Arora", specialization: "Internal Medicine", experience: "31 years" }]),
  hospital("gian-sagar", "Gian Sagar Medical College & Hospital", "Internal Medicine Hospital", "Rajpura", "₹300", 1, 1, "Open today · 9:00 AM - 4:00 PM", [{ name: "Dr. Lalit Kumar", specialization: "Internal Medicine", experience: "21 years" }]),
  hospital("rama-atray", "Rama Atray Memorial Eye Hospital", "Ophthalmology (Eye Doctor) Hospital", "Urban Estate", "₹200", 1, 1, "Open today · 10:00 AM - 1:00 PM", [{ name: "Dr. Rajan Shonek", specialization: "Ophthalmologist", experience: "31 years", rating: "100%" }]),
  hospital("bhatia", "Bhatia Hospital Neuro and Multispeciality", "Multispeciality Hospital", "Fateh Colony", "Not provided", 2, 1, "Open today · 10:00 AM - 2:00 PM", [{ name: "Dr. Kanwarneet Singh", specialization: "General Physician", experience: "7 years" }]),
  hospital("rajindra", "Rajindra Hospital", "Government Tertiary-Care Teaching Hospital", "Sangrur Road", "Government (subsidised)", rajindraSpecialties.length, rajindraDoctors.length, "Open 24x7", rajindraDoctors, {
    address: "Sangrur Road, Patiala, Punjab – 147001", phone: "0175-221-2542",
    specialtiesList: rajindraSpecialties, bedsTotal: "1,009 (+121 in the affiliated TB Hospital)",
    emergency: { available: true, phone: "0175-500-5515", icuBeds: null, notes: "25-bed emergency indoor facility; 3 general ambulances. Gynaecology emergency: 0175-221-3217." },
  }),
  hospital("aas-medicare", "AAS Medicare", "Multispecialty Hospital", "Yadwindra Colony", "Not provided", aasSpecialties.length, aasDoctors.length, "Open 24x7", aasDoctors, {
    address: "49, Yadwindra Colony, Opp. Main Post Office, Patiala, Punjab", phone: "+91-7889023320", email: "aasmedicarepatiala@gmail.com",
    specialtiesList: aasSpecialties,
    emergency: { available: true, icuBeds: "ICU available (bed count not publicly reported)", notes: "24×7 Emergency & Trauma Services. Covers acute medical and surgical conditions, trauma, fractures, head injuries, industrial accidents, poisoning, dengue and sports injuries." },
  }),
  hospital("patiala-heart-institute", "Patiala Heart Institute & Multispeciality Hospital", "Multispeciality Hospital", "Rattan Nagar", "Not provided", heartSpecialties.length, heartDoctors.length, "Open 24x7", heartDoctors, {
    address: "2, Jagdish Marg, Rattan Nagar, Patiala, Punjab – 147001", phone: "0175-2308030 / 0175-2308031", ambulance: "8195881234", email: "info@patialaheart.com",
    specialtiesList: heartSpecialties,
    emergency: { available: true, phone: "0175-2308030", ambulance: "8195881234", icuBeds: "Emergency ICU available", notes: "24×7 Critical Care, Emergency OT, Dialysis and ECMO available as part of emergency/critical-care facilities." },
  }),
];

// Aliases so a search for "Cardiology" also surfaces doctors listed as "Cardiac Sciences", etc.
const specialtyGroups = [
  ["cardiology", "cardiac sciences", "cardiothoracic vascular surgery", "cardiothoracic & vascular surgery", "cardiothoracic surgery", "interventional cardiology", "clinical cardiology"],
  ["ent", "ear-nose-throat (ent) specialist", "otolaryngology", "ent surgery"],
  ["gynaecology", "gynecology", "obstetrics & gynaecology", "obstetrics"],
  ["neurology", "neuro sciences", "neuro sciences – brain & spine", "neurosurgery", "neurosurgery & spine surgery", "brain & spine surgeon"],
  ["orthopaedics", "orthopedics", "ortho", "orthopaedics & joint replacement", "orthopaedics, joint replacement & sports medicine", "orthopaedics & joint replacement surgery"],
  ["dermatology", "dermatology & cosmetology", "dermatology & std", "skin"],
  ["urology", "urology & andrology"],
  ["gastroenterology", "gastro sciences", "medical gastroenterology", "gastroenterology & hepatology"],
  ["pediatrics", "paediatrics", "paediatric surgery", "paediatrics & child care", "paediatrics & neonatology", "child care"],
  ["psychiatry", "psychiatry & de-addiction"],
  ["general physician", "internal medicine", "medicine", "general medicine"],
  ["general surgeon", "general surgery", "general & laparoscopic surgery", "laparoscopic surgery"],
  ["ophthalmologist", "ophthalmology", "eye"],
  ["nephrology", "renal sciences", "renal sciences & kidney transplant", "kidney transplant"],
  ["pulmonology", "pulmonary medicine", "chest medicine", "tb & chest diseases", "chest & respiratory diseases"],
];

const expandSearchTerms = (query) => {
  const q = query.toLowerCase().trim();
  if (!q) return [q];
  const matchedGroups = specialtyGroups.filter(g => g.some(term => term.includes(q) || q.includes(term)));
  return [q, ...matchedGroups.flat()];
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const api = {
  getHospitals: () => hospitals,
  searchDoctors: (query = "") => {
    const all = hospitals.flatMap(h => h.doctors.map(d => ({ ...d, hospital: h.name })));
    const q = query.toLowerCase().trim();
    if (!q) return all;
    const terms = expandSearchTerms(q).filter(Boolean);
    const regexes = terms.map(t => new RegExp(`\\b${escapeRegex(t)}`, "i"));
    return all.filter(d => { const haystack = `${d.name} ${d.specialization} ${d.hospital}`; return regexes.some(r => r.test(haystack)); });
  },
  getEmergencyReadyHospitals: () => hospitals.filter(h => h.emergency && h.emergency.available),
};
