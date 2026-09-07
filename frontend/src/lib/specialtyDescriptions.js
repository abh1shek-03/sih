// Short, layperson-friendly 2-3 line descriptions for every specialty that appears
// across MediConnect's 12 hospitals. Keys are normalised (lowercase, punctuation stripped,
// common suffixes trimmed) so we can match minor naming variations like
// "Renal Sciences" vs "Renal Sciences & Kidney Transplant".

const RAW_DESCRIPTIONS = {
  "Accident & Emergency Care":
    "24×7 first response for trauma, road accidents, poisoning, cardiac arrest and other life-threatening events. Runs the resuscitation bay, stabilises critical patients and hands off to the right specialty within the hospital.",
  "Anaesthesiology":
    "Plans and delivers anaesthesia for surgery — general, regional (spinal/epidural) or local — and manages the patient's vitals, pain and airway during the procedure. Also runs pre-anaesthetic check-ups and post-op recovery.",
  "Bariatric Surgery":
    "Surgical treatment of severe obesity when diet and exercise haven't worked. Common procedures include gastric bypass and sleeve gastrectomy, which also help reverse Type-2 diabetes, high BP and sleep apnoea.",
  "Cardiology":
    "Diagnosis and non-surgical treatment of heart and blood-vessel diseases — heart attacks, chest pain, blocked arteries, heart failure, rhythm disorders and high blood pressure. Uses ECG, echo, TMT and angioplasty.",
  "Cardiac Sciences":
    "Combined cardiology + heart surgery unit that treats heart attacks, valve disease, congenital heart defects and arrhythmias. Offers angioplasty, stenting, pacemakers and open-heart surgery under one roof.",
  "Cardiothoracic Vascular Surgery":
    "Open and minimally-invasive surgery on the heart, lungs and major blood vessels. Handles bypass (CABG) grafts, valve replacements, aneurysm repair and thoracic tumours.",
  "Cancer Care":
    "End-to-end oncology — chemotherapy, radiation, targeted therapy and surgical removal of tumours across breast, lung, colon, blood, cervix and other cancers. Includes screening, second opinions and palliative care.",
  "Dental Medicine":
    "Care of teeth, gums, jaw and oral mucosa. Covers fillings, root canals, extractions, braces, crowns and implants, plus treatment of gum disease and oral infections.",
  "Dental Care":
    "Care of teeth, gums, jaw and oral mucosa. Covers fillings, root canals, extractions, braces, crowns and implants, plus treatment of gum disease and oral infections.",
  "Dermatology":
    "Skin, hair and nail conditions — acne, eczema, psoriasis, fungal infections, hair loss, vitiligo and allergies. Also handles skin cancer screening and cosmetic procedures like chemical peels.",
  "Dermatology & Cosmetology":
    "Medical skin, hair and nail care plus aesthetic treatments — acne, eczema, psoriasis, hair loss, pigmentation, laser hair removal, chemical peels and anti-ageing procedures.",
  "Diabetes & Endocrinology":
    "Treats hormone-related conditions — diabetes (Type 1 & 2), thyroid disorders, PCOS, adrenal problems, osteoporosis and growth-hormone issues. Focuses on medication, diet and long-term monitoring.",
  "Endocrinology":
    "Hormone-related conditions such as diabetes, thyroid disorders, PCOS, adrenal problems and osteoporosis. Treatment centres on medication, diet and long-term follow-up.",
  "ENT":
    "Ear, nose and throat problems — hearing loss, vertigo, sinusitis, nasal blockage, tonsillitis, snoring, voice hoarseness and head-and-neck tumours. Includes hearing aids, surgery and endoscopic procedures.",
  "Otolaryngology":
    "Same specialty as ENT — ear, nose and throat problems including hearing loss, vertigo, sinusitis, tonsillitis, snoring and head-and-neck tumours.",
  "Ear-Nose-Throat (ENT) Specialist":
    "Ear, nose and throat problems — hearing loss, vertigo, sinusitis, nasal blockage, tonsillitis, snoring and head-and-neck tumours. Includes surgery and endoscopic procedures.",
  "Gastrointestinal Sciences":
    "Diseases of the food pipe, stomach, intestines, liver, pancreas and gallbladder — acidity, ulcers, IBD, hepatitis, gallstones and GI cancers. Uses endoscopy, colonoscopy, ERCP and both open and laparoscopic surgery.",
  "Gastro Sciences":
    "Diseases of the food pipe, stomach, intestines, liver, pancreas and gallbladder — acidity, ulcers, IBD, hepatitis, gallstones and GI cancers. Uses endoscopy, colonoscopy, ERCP and surgery.",
  "Medical Gastroenterology":
    "Non-surgical treatment of digestive-system diseases — acidity, ulcers, hepatitis, IBS, IBD and pancreatitis. Uses endoscopy, colonoscopy and ERCP for diagnosis and therapy.",
  "General Surgery":
    "Common operations on the abdomen, breast, thyroid, hernia, appendix, gallbladder and skin lumps. Increasingly done via laparoscopic (keyhole) techniques for faster recovery.",
  "General & Laparoscopic Surgery":
    "Common surgeries on the abdomen, hernia, gallbladder, appendix, thyroid and breast lumps — most performed laparoscopically (keyhole) for smaller scars and shorter hospital stays.",
  "ICU & Critical Care":
    "Round-the-clock intensive care for patients on ventilators, in septic shock, after major surgery, or with multi-organ failure. Continuous monitoring with dedicated critical-care doctors and nurses.",
  "Critical Care":
    "Round-the-clock intensive care for patients on ventilators, in septic shock, after major surgery, or with multi-organ failure. Continuous monitoring with dedicated critical-care doctors and nurses.",
  "Infectious Disease":
    "Complex or unusual infections — dengue, typhoid, TB, HIV, hepatitis, MRSA and travel-related fevers. Advises on antibiotic choice, resistance and prevention.",
  "Internal Medicine":
    "First-contact adult care for fever, diabetes, hypertension, thyroid problems, infections and lifestyle diseases. Coordinates onward referral to organ-specific specialists when needed.",
  "Internal Medicine & Geriatric":
    "Adult and elderly care — diabetes, hypertension, infections, memory concerns and multi-organ diseases common with age. Manages medications and coordinates care across specialties.",
  "Kidney Transplant":
    "Surgical transplantation of a donor kidney into a patient with end-stage renal failure, plus long-term immunosuppression and follow-up. Includes work-up, matching and post-transplant care.",
  "Laboratory Medicine":
    "Runs the diagnostic lab — blood tests, urine tests, cultures, biopsies and pathology reports that other doctors rely on to make a diagnosis and monitor treatment.",
  "Pathology & Microbiology":
    "Analyses blood, urine, tissue biopsies and cultures to identify diseases and infections. Reports guide the treating doctor on diagnosis, drug choice and progress.",
  "Neonatology & NICU":
    "Specialist care for newborns — especially preterm babies, low-birth-weight, jaundice, sepsis and birth-related complications. Runs the neonatal intensive-care unit (NICU) with ventilators and incubators.",
  "Nephrology":
    "Non-surgical care of kidney disease — chronic kidney disease, kidney stones, urinary infections, protein/blood in urine, dialysis and transplant follow-up.",
  "Renal Sciences":
    "Combined kidney medicine and surgery — chronic kidney disease, kidney stones, dialysis, transplant work-up and long-term follow-up.",
  "Renal Sciences & Kidney Transplant":
    "Full kidney unit — diagnosis and medical management of kidney disease, dialysis services, plus surgical kidney transplantation and lifelong post-transplant follow-up.",
  "Neurology":
    "Non-surgical treatment of brain, spinal-cord and nerve conditions — stroke, epilepsy, migraine, Parkinson's, dementia, multiple sclerosis and nerve weakness.",
  "Neurosurgery":
    "Surgery on the brain, spinal cord and nerves — for brain tumours, head injuries, slipped discs, spinal fractures, aneurysms and hydrocephalus. Often uses microscopes and image guidance.",
  "Neuro Sciences – Brain & Spine":
    "Combined neurology + neurosurgery — treats stroke, epilepsy, brain tumours, head injuries, slipped discs and spinal fractures. Uses image-guided and minimally-invasive spine techniques.",
  "Nutrition & Dietetics":
    "Personalised diet plans for diabetes, weight loss/gain, kidney disease, heart disease, pregnancy, paediatric growth and post-surgery recovery. Also counsels on food allergies and eating disorders.",
  "Obstetrics & Gynaecology":
    "Care of women's reproductive health across pregnancy, childbirth, menstrual disorders, PCOS, fibroids, infertility, menopause and gynaecological cancers.",
  "Ophthalmology":
    "Eye care — refraction problems (specs/lens numbers), cataract, glaucoma, diabetic retinopathy, corneal disease and squint. Includes cataract surgery and laser vision correction.",
  "Ophthalmology (Eye Doctor) Hospital":
    "Full-service eye care — refraction, cataract surgery, glaucoma, diabetic retinopathy, corneal disease, retinal problems and paediatric squint.",
  "Ophthalmologist":
    "Eye specialist — treats refraction problems, cataract, glaucoma, diabetic retinopathy, corneal disease and squint. Performs cataract and laser eye surgery.",
  "Orthopaedics":
    "Bone, joint, muscle and ligament problems — fractures, arthritis, back and neck pain, sports injuries, and joint replacements (knee, hip, shoulder).",
  "Orthopaedics, Joint Replacement & Sports Medicine":
    "Complete musculoskeletal care — fractures, arthritis, sports injuries, arthroscopic (keyhole) surgery, and knee/hip/shoulder joint replacement.",
  "Orthopaedics & Joint Replacement Surgery":
    "Advanced bone and joint care — arthritis, complex fractures, sports injuries, arthroscopy and knee, hip, shoulder and elbow replacements.",
  "Paediatrics":
    "Care of children from birth to adolescence — routine growth check-ups, vaccinations, common infections, asthma, allergies and childhood illnesses.",
  "Paediatrics & Child Care":
    "Care of children from birth to adolescence — routine check-ups, vaccinations, common infections, asthma, allergies and childhood illnesses.",
  "Paediatrics & Neonatology":
    "Combined care for newborns and older children — NICU care for preterm babies plus routine paediatrics, vaccinations, infections and growth issues.",
  "Paediatric Surgery":
    "Surgery for children — congenital defects (cleft, hernia, undescended testes), paediatric appendix, hydrocephalus and childhood tumours.",
  "Pain Medicine":
    "Specialist relief of chronic pain — back pain, cancer pain, nerve pain, arthritis and post-surgery pain. Uses injections, nerve blocks and medication plans.",
  "Physiotherapy":
    "Non-drug rehabilitation using exercise, stretching, manual therapy and electrotherapy. Helps recovery from strokes, spine and joint surgery, sports injuries and back/neck pain.",
  "Plastic, Reconstructive & Cosmetic Surgery":
    "Reconstructive surgery for burns, trauma, cleft lip/palate and cancer defects, plus cosmetic procedures like rhinoplasty, breast surgery and liposuction.",
  "Plastic & Cosmetic Surgery":
    "Reconstructive surgery for burns, trauma and cancer defects, plus cosmetic procedures like rhinoplasty, breast surgery and liposuction.",
  "Psychiatry":
    "Diagnosis and treatment of mental-health conditions — depression, anxiety, bipolar disorder, schizophrenia, addictions, OCD and sleep disorders. Combines medication with counselling.",
  "Pulmonary Medicine":
    "Lung and airway diseases — asthma, COPD, tuberculosis, pneumonia, sleep apnoea and lung cancer. Uses spirometry, bronchoscopy and CT imaging.",
  "Chest & Respiratory Diseases":
    "Lung and airway diseases — asthma, COPD, tuberculosis, pneumonia, sleep apnoea and lung cancer. Uses spirometry, bronchoscopy and CT imaging.",
  "Radiology":
    "Runs X-ray, ultrasound, CT, MRI, mammography and image-guided biopsies. Reports help other doctors diagnose and plan treatment.",
  "Interventional Radiology & Imaging":
    "Diagnostic imaging (X-ray, CT, MRI, ultrasound) plus minimally-invasive image-guided treatments — biopsies, angioplasty, tumour ablation and drainage procedures.",
  "Nuclear Medicine":
    "Uses small doses of radioactive tracers for diagnostic scans (PET, thyroid scan, bone scan) and for treating certain thyroid conditions and cancers.",
  "Rheumatology":
    "Autoimmune and joint-inflammation diseases — rheumatoid arthritis, lupus, gout, ankylosing spondylitis and vasculitis. Focuses on long-term medication and mobility.",
  "Spine Care":
    "Dedicated care for back and neck problems — slipped discs, sciatica, spinal fractures, scoliosis and spinal tumours. Includes minimally-invasive and open spine surgery.",
  "Urology":
    "Diseases of the urinary system and male reproductive organs — kidney stones, urinary infections, prostate problems, incontinence, male infertility and urological cancers.",
  "Bone Marrow Transplant":
    "Transplantation of healthy bone marrow (own or donor's) to treat blood cancers like leukaemia and lymphoma, aplastic anaemia and thalassaemia.",
  "Fertility Management":
    "Investigation and treatment of infertility in both partners — ovulation induction, IUI, IVF, ICSI and surgical correction of blocked tubes or fibroids.",
  "Blood Bank":
    "Collects, screens, stores and issues blood and blood components (red cells, platelets, plasma) for transfusions during surgery, trauma and treatment of blood disorders.",
  "Robotic Surgeries":
    "Uses robotic-arm platforms (e.g. da Vinci) for high-precision minimally-invasive surgery — cancer, gynaecology, urology and gastrointestinal procedures with smaller scars and faster recovery.",
  "Consultant Physician":
    "Senior adult-medicine doctor for fever, diabetes, hypertension, infections and lifestyle diseases. Manages medications and refers on to organ-specific specialists when required.",
  "General Physician":
    "First-contact doctor for common adult illnesses — fever, cough, diabetes, hypertension, infections and preventive check-ups. Refers on to specialists when required.",
};

const canon = (s) =>
  String(s)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const LOOKUP = Object.fromEntries(
  Object.entries(RAW_DESCRIPTIONS).map(([k, v]) => [canon(k), v])
);

// Handful of shorter fallbacks — matched as substrings against the canonicalised name.
const SUBSTRING_FALLBACKS = [
  ["cardiac", RAW_DESCRIPTIONS["Cardiac Sciences"]],
  ["cardio", RAW_DESCRIPTIONS["Cardiology"]],
  ["neuro", RAW_DESCRIPTIONS["Neurology"]],
  ["gastro", RAW_DESCRIPTIONS["Gastrointestinal Sciences"]],
  ["renal", RAW_DESCRIPTIONS["Renal Sciences"]],
  ["kidney", RAW_DESCRIPTIONS["Nephrology"]],
  ["ortho", RAW_DESCRIPTIONS["Orthopaedics"]],
  ["ent", RAW_DESCRIPTIONS["ENT"]],
  ["otolar", RAW_DESCRIPTIONS["Otolaryngology"]],
  ["ophth", RAW_DESCRIPTIONS["Ophthalmology"]],
  ["eye", RAW_DESCRIPTIONS["Ophthalmology"]],
  ["derma", RAW_DESCRIPTIONS["Dermatology"]],
  ["cosmet", RAW_DESCRIPTIONS["Dermatology & Cosmetology"]],
  ["paediatric", RAW_DESCRIPTIONS["Paediatrics"]],
  ["pediatric", RAW_DESCRIPTIONS["Paediatrics"]],
  ["obstet", RAW_DESCRIPTIONS["Obstetrics & Gynaecology"]],
  ["gynae", RAW_DESCRIPTIONS["Obstetrics & Gynaecology"]],
  ["urolog", RAW_DESCRIPTIONS["Urology"]],
  ["pulmo", RAW_DESCRIPTIONS["Pulmonary Medicine"]],
  ["respir", RAW_DESCRIPTIONS["Chest & Respiratory Diseases"]],
  ["chest", RAW_DESCRIPTIONS["Chest & Respiratory Diseases"]],
  ["psychiat", RAW_DESCRIPTIONS["Psychiatry"]],
  ["radio", RAW_DESCRIPTIONS["Radiology"]],
  ["nuclear", RAW_DESCRIPTIONS["Nuclear Medicine"]],
  ["patholog", RAW_DESCRIPTIONS["Pathology & Microbiology"]],
  ["laborator", RAW_DESCRIPTIONS["Laboratory Medicine"]],
  ["endocrin", RAW_DESCRIPTIONS["Endocrinology"]],
  ["diabet", RAW_DESCRIPTIONS["Diabetes & Endocrinology"]],
  ["cancer", RAW_DESCRIPTIONS["Cancer Care"]],
  ["oncolog", RAW_DESCRIPTIONS["Cancer Care"]],
  ["dental", RAW_DESCRIPTIONS["Dental Medicine"]],
  ["dentist", RAW_DESCRIPTIONS["Dental Medicine"]],
  ["spine", RAW_DESCRIPTIONS["Spine Care"]],
  ["rheum", RAW_DESCRIPTIONS["Rheumatology"]],
  ["anaesth", RAW_DESCRIPTIONS["Anaesthesiology"]],
  ["anesth", RAW_DESCRIPTIONS["Anaesthesiology"]],
  ["bariatric", RAW_DESCRIPTIONS["Bariatric Surgery"]],
  ["physio", RAW_DESCRIPTIONS["Physiotherapy"]],
  ["nutrition", RAW_DESCRIPTIONS["Nutrition & Dietetics"]],
  ["diet", RAW_DESCRIPTIONS["Nutrition & Dietetics"]],
  ["infect", RAW_DESCRIPTIONS["Infectious Disease"]],
  ["intensive", RAW_DESCRIPTIONS["ICU & Critical Care"]],
  ["critical", RAW_DESCRIPTIONS["Critical Care"]],
  ["icu", RAW_DESCRIPTIONS["ICU & Critical Care"]],
  ["emergency", RAW_DESCRIPTIONS["Accident & Emergency Care"]],
  ["accident", RAW_DESCRIPTIONS["Accident & Emergency Care"]],
  ["trauma", RAW_DESCRIPTIONS["Accident & Emergency Care"]],
  ["plastic", RAW_DESCRIPTIONS["Plastic & Cosmetic Surgery"]],
  ["reconstruct", RAW_DESCRIPTIONS["Plastic, Reconstructive & Cosmetic Surgery"]],
  ["laparo", RAW_DESCRIPTIONS["General & Laparoscopic Surgery"]],
  ["general surg", RAW_DESCRIPTIONS["General Surgery"]],
  ["fertil", RAW_DESCRIPTIONS["Fertility Management"]],
  ["ivf", RAW_DESCRIPTIONS["Fertility Management"]],
  ["blood bank", RAW_DESCRIPTIONS["Blood Bank"]],
  ["bone marrow", RAW_DESCRIPTIONS["Bone Marrow Transplant"]],
  ["robotic", RAW_DESCRIPTIONS["Robotic Surgeries"]],
  ["neonat", RAW_DESCRIPTIONS["Neonatology & NICU"]],
  ["nicu", RAW_DESCRIPTIONS["Neonatology & NICU"]],
  ["geriatric", RAW_DESCRIPTIONS["Internal Medicine & Geriatric"]],
  ["internal medicine", RAW_DESCRIPTIONS["Internal Medicine"]],
  ["consultant physician", RAW_DESCRIPTIONS["Consultant Physician"]],
  ["general physician", RAW_DESCRIPTIONS["General Physician"]],
  ["pain", RAW_DESCRIPTIONS["Pain Medicine"]],
];

export function describeSpecialty(name) {
  if (!name) return null;
  const key = canon(name);
  if (LOOKUP[key]) return LOOKUP[key];
  for (const [fragment, description] of SUBSTRING_FALLBACKS) {
    if (key.includes(fragment)) return description;
  }
  return "Specialised medical service. Ask the hospital reception for exactly which conditions are treated here and which doctor to consult.";
}
