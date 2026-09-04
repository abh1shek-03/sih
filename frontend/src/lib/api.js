const hospital = (id, name, type, area, fee, specialties, doctorCount, opd, doctors) => ({
  id, name, type, location: { area }, consultationFees: fee, specialtyCount: specialties, doctorCount, opd,
  overallStatus: "unknown", phone: "Hospital contact pending verification", ambulance: null,
  isSeedData: true, verificationStatus: "unverified", wards: [], doctors: doctors.map((d, index) => ({ id: `${id}-d${index}`, ...d, status: "unavailable" })),
});

const hospitals = [
  hospital("gursharan", "Gursharan Hospital", "Multi-speciality Hospital", "Tripri", "₹200 - ₹600", 2, 2, "Open 24x7", [
    { name: "Dr. Rav Sharan", specialization: "General Physician", experience: "17 years", rating: "93% · 818 Patient Stories" },
    { name: "Dr. Dinkar Sood", specialization: "Plastic Surgeon", experience: "18 years", rating: "4.5 · 681 rated" },
  ]),
  hospital("manipal-patiala", "Manipal Hospital, Patiala", "Multi-speciality Hospital", "Patiala", "₹0 - ₹500", 3, 17, "Open 24x7", [
    { name: "Dr. Avind Kumar Alias Hussan Lal", specialization: "General Physician", experience: "51 years" }, { name: "Dr. Singh Guliani Manjit", specialization: "General Physician", experience: "45 years" }, { name: "Dr. Gulzar Singh", specialization: "General Physician", experience: "37 years" }, { name: "Dr. Bachan Lal", specialization: "General Physician", experience: "36 years" }, { name: "Dr. sumeet kumar t r jhingan", specialization: "General Physician", experience: "24 years" }, { name: "Dr. PREETI DALLA", specialization: "General Physician", experience: "21 years" }, { name: "Dr. Kumar Nitin", specialization: "General Physician", experience: "18 years" }, { name: "Dr. Gurbir Singh Sidhu", specialization: "General Physician", experience: "18 years" }, { name: "Dr. Punashish Kaur", specialization: "General Physician", experience: "16 years" }, { name: "Dr. Lipsy Bansal", specialization: "General Physician", experience: "12 years" },
  ]),
  hospital("park-patiala", "Park Hospital", "Multi-speciality Hospital", "Urban Estate", "₹0 - ₹500", 7, 12, "Open 24x7", [
    { name: "Dr. Balvinder Kumar", specialization: "General Physician", experience: "27 years", rating: "100%" }, { name: "Dr. Amarjit Singh", specialization: "General Physician", experience: "36 years" }, { name: "Dr. Anjali Gupta", specialization: "General Physician", experience: "22 years" }, { name: "Dr. Ramandeep Singh Sekhon", specialization: "General Physician", experience: "22 years" }, { name: "Dr. Himpreet Kaur", specialization: "General Physician", experience: "19 years" }, { name: "Dr. Jivtesh Singh", specialization: "General Physician", experience: "15 years" }, { name: "Dr. Parvinderjit Singh Kohli", specialization: "Ear-Nose-Throat (ENT) Specialist", experience: "25 years" }, { name: "Dr. Gurjot Singh", specialization: "General Surgeon", experience: "16 years" }, { name: "Dr. Harsimran Jit Singh", specialization: "Cardiologist", experience: "15 years" }, { name: "Dr. Priya Agrawal", specialization: "Ophthalmologist", experience: "16 years" },
  ]),
  hospital("simran-ent", "Simran ENT Centre", "Ear-Nose-Throat (ENT) Hospital", "Patiala", "₹150", 1, 1, "Open today · 8:00 AM - 8:00 PM", [{ name: "Dr. Harsimran Singh", specialization: "Ear-Nose-Throat (ENT) Specialist", experience: "20 years" }]),
  hospital("guru-eye", "Guru Teg Bahadur Eye Hospital", "Ophthalmology (Eye Doctor) Hospital", "Patiala City", "₹100", 1, 1, "Open today · 9:00 AM - 2:00 PM", [{ name: "Dr. Ashapritpal Kaur", specialization: "Ophthalmologist", experience: "16 years" }]),
  hospital("sanjivni", "Sanjivni Multyspeciality Hospital", "Consultant Physician Hospital", "Rajpura", "₹325", 3, 1, "Open today · 9:00 AM - 2:00 PM", [{ name: "Dr. Yogesh Arora", specialization: "Internal Medicine", experience: "31 years" }]),
  hospital("gian-sagar", "Gian Sagar Medical College & Hospital", "Internal Medicine Hospital", "Rajpura", "₹300", 1, 1, "Open today · 9:00 AM - 4:00 PM", [{ name: "Dr. Lalit Kumar", specialization: "Internal Medicine", experience: "21 years" }]),
  hospital("rama-atray", "Rama Atray Memorial Eye Hospital", "Ophthalmology (Eye Doctor) Hospital", "Urban Estate", "₹200", 1, 1, "Open today · 10:00 AM - 1:00 PM", [{ name: "Dr. Rajan Shonek", specialization: "Ophthalmologist", experience: "31 years", rating: "100%" }]),
  hospital("bhatia", "Bhatia Hospital Neuro and Multispeciality", "Multispeciality Hospital", "Fateh Colony", "Not provided", 2, 1, "Open today · 10:00 AM - 2:00 PM", [{ name: "Dr. Kanwarneet Singh", specialization: "General Physician", experience: "7 years" }]),
  hospital("rajindra", "RAJINDRA HOSPITAL", "Dermatology Hospital", "Fateh Colony", "Not provided", 3, 2, "Open today · 10:00 AM - 2:00 PM", [{ name: "Dr. Aditya Duggal", specialization: "General Physician", experience: "9 years" }, { name: "Dr. J P Goyal", specialization: "Ear-Nose-Throat (ENT) Specialist", experience: "50 years" }]),
];

export const api = {
  getHospitals: () => hospitals,
  searchDoctors: (query = "") => hospitals.flatMap(h => h.doctors.map(d => ({ ...d, hospital: h.name }))).filter(d => `${d.name} ${d.specialization} ${d.hospital}`.toLowerCase().includes(query.toLowerCase())),
};