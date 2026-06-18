/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext } from 'react';

const LanguageContext = createContext();

const translations = {
  en: {
    // Nav & Common
    home: "Home",
    aiAssistant: "AI Assistant",
    medicineInfo: "Medicine Info",
    symptoms: "Symptoms",
    nearby: "Nearby",
    dashboard: "Dashboard",
    ocr: "Prescription OCR",
    notMedicalAdvice: "Not Medical Advice",
    disclaimer: "This tool is for informational purposes only. It recommends self-care protocols for symptoms but does not diagnose diseases. Always consult a healthcare professional for clinical advice.",
    backToHome: "Back to Home",
    loading: "Loading...",
    search: "Search",

    // Home Page
    heroBadge: "AI-Powered Healthcare",
    heroTitlePre: "Your Smart ",
    heroTitlePost: " Companion",
    heroSubtitle: "Consult our AI Assistant, get step-by-step self-care instructions, check medicine details, and know exactly when to seek immediate medical help.",
    consultBtn: "Consult AI Assistant",
    checkSymptomsBtn: "Check Symptoms",
    featuresTitle: "Everything you need",
    cardOcrTitle: "Prescription OCR",
    cardOcrDesc: "Upload a prescription photo - OCR auto-identifies medicines and pulls drug data instantly.",
    cardDashboardTitle: "Health Dashboard",
    cardDashboardDesc: "Track vitals, log symptoms, and monitor your personal health trends over time.",
    cardSosTitle: "Emergency SOS",
    cardSosDesc: "One-tap integration to trigger emergency protocols and locate nearest care.",
    cardLangTitle: "Multi-Language",
    cardLangDesc: "Full English + Hindi support, making healthcare accessible across diverse communities.",

    // AI Assistant
    aiAssistantTitle: "AI Health Assistant",
    aiAssistantSubtitle: "Consult our medical chatbot to receive immediate self-care recommendations and severity warnings.",
    suggestedQueries: "Suggested Queries:",
    askPlaceholder: "Ask about a symptom, self-care steps, or health concerns...",
    welcomeMsg: "Hello! I am your MedWeb AI Health Assistant. Ask me about a symptom or health concern, and I will guide you with self-care steps and let you know when to seek immediate medical help.",
    activeReady: "Active & Ready",
    medicalAiAssistant: "Medical AI Assistant",

    // Symptoms Checker
    symptomTitle: "Symptom Care Center",
    symptomSubtitle: "Search a symptom to view instant, structured home care instructions and emergency severity criteria.",
    symptomsInputLabel: "Your Symptoms",
    symptomsInputPlaceholder: "E.g., severe headache, nausea, sensitivity to light...",
    analyzeBtn: "Analyze Symptoms",
    analyzingState: "Analyzing symptoms and preparing care guidelines...",
    resultsTitle: "AI Care Guidance for",
    possibleCondition: "Possible Condition:",
    homeSelfCare: "Home Self-Care Steps",
    whatToEat: "What to Eat",
    whatToAvoid: "What to Avoid",
    whenSeekHelp: "When to Seek Medical Help",

    // Medicine Info
    medTitle: "Medicine Directory",
    medSubtitle: "Lookup safety ratings, correct dosage, manufacturer details, and pricing guidelines.",
    medInputLabel: "Medicine Name",
    medInputPlaceholder: "E.g., Paracetamol, Amoxicillin, Ibuprofen...",
    searchingMed: "Searching medicine database and pricing...",
    medFormula: "Active Formula:",
    medCategory: "Class/Category:",
    medManufacturer: "Manufacturer:",
    medPrice: "Est. Price (1mg):",
    medDiscounted: "Discounted Price:",
    medPackSize: "Pack Size:",
    medDescription: "Primary Uses & Indications",
    medDosage: "Recommended Dosage Guidelines",
    medRisks: "Common Side Effects / Risks",
    medSafety: "Pregnancy & Lifestyle Safety Warning",
    pregnancySafety: "Pregnancy Safety:",
    alcoholSafety: "Alcohol Warning:",
    medNoResults: "No direct matching drugs found in FDA database. Below is general information from alternative sources.",

    // Nearby Services
    nearbyTitle: "Nearby Services Locator",
    nearbySubtitle: "Find local clinics, hospitals, and pharmacies based on your live location.",
    gpsLocating: "Requesting GPS coordinates...",
    facilityLabel: "Facility Type",
    radiusLabel: "Search Radius (meters)",
    findServices: "Find Services",
    searchingServices: "Locating nearby healthcare providers...",
    distance: "Distance",
    statusOpen: "Open Now",
    statusClosed: "Closed",
    noRating: "No Rating",
    noServicesFound: "No nearby services found. Try extending your search radius or check your GPS settings.",
    emergencyBtn: "Trigger Emergency SOS",

    // SOS Modal
    emergencyAlert: "EMERGENCY ALERT",
    emergencyGuidelines: "We have detected an emergency command. Please follow these guidelines immediately:",
    sosStep1: "1. Stay calm and sit down to stabilize breathing.",
    sosStep2: "2. Do not attempt to drive yourself to a hospital.",
    sosStep3: "3. If pain or breathing worsens, contact local emergency services immediately.",
    sosEmergencyServices: "Call Emergency Services (108 / 911)",

    // OCR Scanner
    ocrTitle: "Prescription OCR Scanner",
    ocrSubtitle: "Upload a photo of your medical prescription. Our AI reads the text and extracts medicine details instantly.",
    dragDrop: "Drag & drop prescription image here, or click to upload",
    supportedFormats: "Supports PNG, JPG, JPEG",
    ocrInit: "Initializing OCR Engine...",
    ocrProgress: "Recognizing text...",
    ocrSuccess: "OCR complete! Extracted text parsed successfully.",
    ocrNoMeds: "We read the text, but couldn't auto-identify any matching medicine names. Try uploading a clearer picture or search manually.",
    ocrMedsFound: "Medicines Identified",
    ocrViewClinicalInfo: "View Details",
    rawText: "Extracted Raw Text",

    // Dashboard
    dashTitle: "Vitals & Symptoms Dashboard",
    dashSubtitle: "Log your daily health metrics, track vitals, and monitor trends over time.",
    logVitals: "Log Vitals",
    heartRate: "Heart Rate",
    bloodPressure: "Blood Pressure",
    bloodSugar: "Blood Sugar",
    bodyTemp: "Body Temperature",
    systolic: "Systolic",
    diastolic: "Diastolic",
    saveVitals: "Save Vitals",
    logSymptoms: "Log Symptom",
    symptomSeverity: "Symptom Severity (1-10)",
    notes: "Notes / Details",
    saveSymptom: "Save Log",
    statsSummary: "Health Stats Summary",
    avgHeartRate: "Avg Heart Rate",
    latestBp: "Latest BP Status",
    maxSugar: "Max Blood Sugar",
    avgTemp: "Avg Temperature",
    normal: "Normal",
    prehypertensive: "Prehypertensive",
    hypertensive: "High (Hypertension)",
    highSugarAlert: "High Sugar Warning (>140 mg/dL)",
    feverAlert: "Fever Warning (>=100.4°F)",
    vitalsTrends: "Vitals Trends over Time",
    loggedDataHistory: "Health Log History",
    date: "Date",
    vitals: "Vitals",
    severity: "Severity",
    actions: "Actions",
    noVitalsLogged: "No vitals logged yet. Fill out the form above to start tracking.",
    noSymptomsLogged: "No symptoms logged yet. Keep track of your daily symptom severity below.",
    clearAll: "Clear All Logs"
  },
  hi: {
    // Nav & Common
    home: "मुख्य पृष्ठ",
    aiAssistant: "एआई सहायक",
    medicineInfo: "दवा जानकारी",
    symptoms: "लक्षण जांचें",
    nearby: "निकटतम सेवाएं",
    dashboard: "स्वास्थ्य डैशबोर्ड",
    ocr: "पर्ची ओसीआर",
    notMedicalAdvice: "चिकित्सीय सलाह नहीं",
    disclaimer: "यह उपकरण केवल सूचनात्मक उद्देश्यों के लिए है। यह लक्षणों के लिए घरेलू उपचार की सिफारिश करता है लेकिन बीमारियों का निदान नहीं करता है। नैदानिक सलाह के लिए हमेशा डॉक्टर से संपर्क करें।",
    backToHome: "मुख्य पृष्ठ पर जाएं",
    loading: "लोड हो रहा है...",
    search: "खोजें",

    // Home Page
    heroBadge: "एआई-संचालित स्वास्थ्य सेवा",
    heroTitlePre: "आपका स्मार्ट ",
    heroTitlePost: " साथी",
    heroSubtitle: "हमारे एआई सहायक से परामर्श करें, चरण-दर-चरण देखभाल निर्देश प्राप्त करें, दवा के विवरण की जांच करें और आपातकालीन स्थिति का समय पर पता लगाएं।",
    consultBtn: "एआई सहायक से बात करें",
    checkSymptomsBtn: "लक्षणों की जांच करें",
    featuresTitle: "आपकी जरूरत का सब कुछ",
    cardOcrTitle: "पर्ची ओसीआर",
    cardOcrDesc: "नुस्खे की तस्वीर अपलोड करें - ओसीआर स्वचालित रूप से दवाओं की पहचान करता है और डेटा दिखाता है।",
    cardDashboardTitle: "स्वास्थ्य डैशबोर्ड",
    cardDashboardDesc: "विटल्स को ट्रैक करें, लक्षणों को रिकॉर्ड करें और समय के साथ व्यक्तिगत स्वास्थ्य रुझानों की निगरानी करें।",
    cardSosTitle: "आपातकालीन एसओएस",
    cardSosDesc: "आपातकालीन प्रोटोकॉल को सक्रिय करने और निकटतम देखभाल खोजने के लिए एक-टैप एकीकरण।",
    cardLangTitle: "बहु-भाषा",
    cardLangDesc: "पूर्ण अंग्रेजी + हिंदी सहायता, स्वास्थ्य सेवाओं को विभिन्न समुदायों के लिए सुलभ बनाती है।",

    // AI Assistant
    aiAssistantTitle: "एआई स्वास्थ्य सहायक",
    aiAssistantSubtitle: "तत्काल देखभाल सिफारिशें और गंभीरता चेतावनियां प्राप्त करने के लिए हमारे चैटबॉट से परामर्श करें।",
    suggestedQueries: "सुझाए गए प्रश्न:",
    askPlaceholder: "लक्षणों, देखभाल के कदमों, या स्वास्थ्य संबंधी चिंताओं के बारे में पूछें...",
    welcomeMsg: "नमस्ते! मैं आपका मेडवेब एआई स्वास्थ्य सहायक हूं। मुझसे किसी लक्षण या स्वास्थ्य चिंता के बारे में पूछें, और मैं आपका मार्गदर्शन करूँगा।",
    activeReady: "सक्रिय और तैयार",
    medicalAiAssistant: "मेडिकल एआई सहायक",

    // Symptoms Checker
    symptomTitle: "लक्षण देखभाल केंद्र",
    symptomSubtitle: "तत्काल, व्यवस्थित घरेलू देखभाल निर्देश और आपातकालीन गंभीरता मानदंड देखने के लिए लक्षण खोजें।",
    symptomsInputLabel: "आपके लक्षण",
    symptomsInputPlaceholder: "जैसे, गंभीर सिरदर्द, मतली, रोशनी के प्रति संवेदनशीलता...",
    analyzeBtn: "लक्षणों का विश्लेषण करें",
    analyzingState: "लक्षणों का विश्लेषण और देखभाल दिशानिर्देश तैयार किए जा रहे हैं...",
    resultsTitle: "के लिए एआई देखभाल मार्गदर्शन",
    possibleCondition: "संभावित बीमारी:",
    homeSelfCare: "घरेलू देखभाल के कदम",
    whatToEat: "क्या खाएं",
    whatToAvoid: "किससे बचें",
    whenSeekHelp: "डॉक्टर से कब संपर्क करें",

    // Medicine Info
    medTitle: "दवा निर्देशिका",
    medSubtitle: "सुरक्षा रेटिंग, सही खुराक, निर्माता विवरण और मूल्य निर्धारण दिशानिर्देशों की जांच करें।",
    medInputLabel: "दवा का नाम",
    medInputPlaceholder: "जैसे, पैरासिटामोल, एमोक्सिसिलिन, इबुप्रोफेन...",
    searchingMed: "दवा डेटाबेस और कीमतों की खोज की जा रही है...",
    medFormula: "सक्रिय फार्मूला:",
    medCategory: "वर्ग/श्रेणी:",
    medManufacturer: "निर्माता:",
    medPrice: "अनुमानित मूल्य (1mg):",
    medDiscounted: "छूट वाला मूल्य:",
    medPackSize: "पैक का आकार:",
    medDescription: "प्राथमिक उपयोग और संकेत",
    medDosage: "अनुशंसित खुराक दिशानिर्देश",
    medRisks: "सामान्य दुष्प्रभाव / जोखिम",
    medSafety: "गर्भावस्था और जीवनशैली सुरक्षा चेतावनी",
    pregnancySafety: "गर्भावस्था सुरक्षा:",
    alcoholSafety: "शराब चेतावनी:",
    medNoResults: "एफडीए डेटाबेस में कोई सीधा मिलान नहीं मिला। नीचे वैकल्पिक स्रोतों से सामान्य जानकारी दी गई है।",

    // Nearby Services
    nearbyTitle: "निकटतम सेवा खोजक",
    nearbySubtitle: "अपने लाइव स्थान के आधार पर स्थानीय क्लीनिकों, अस्पतालों और दवाखानों को खोजें।",
    gpsLocating: "जीपीएस निर्देशांक का अनुरोध किया जा रहा है...",
    facilityLabel: "सुविधा का प्रकार",
    radiusLabel: "खोज दायरा (मीटर)",
    findServices: "सेवाएं खोजें",
    searchingServices: "निकटतम स्वास्थ्य सेवा प्रदाताओं का पता लगाया जा रहा है...",
    distance: "दूरी",
    statusOpen: "अभी खुला है",
    statusClosed: "बंद है",
    noRating: "कोई रेटिंग नहीं",
    noServicesFound: "कोई निकटतम सेवाएं नहीं मिलीं। अपना खोज दायरा बढ़ाएं या जीपीएस जांचें।",
    emergencyBtn: "आपातकालीन एसओएस सक्रिय करें",

    // SOS Modal
    emergencyAlert: "आपातकालीन चेतावनी",
    emergencyGuidelines: "हमें एक आपातकालीन कमांड मिली है। कृपया तुरंत इन दिशानिर्देशों का पालन करें:",
    sosStep1: "1. शांत रहें और सांस लेने को स्थिर करने के लिए बैठ जाएं।",
    sosStep2: "2. खुद गाड़ी चलाकर अस्पताल जाने की कोशिश न करें।",
    sosStep3: "3. यदि दर्द या सांस लेने में तकलीफ बढ़ती है, तो तुरंत आपातकालीन सेवाओं से संपर्क करें।",
    sosEmergencyServices: "आपातकालीन सेवाओं को कॉल करें (108 / 911)",

    // OCR Scanner
    ocrTitle: "नुस्खा ओसीआर स्कैनर",
    ocrSubtitle: "अपने मेडिकल नुस्खे की एक फोटो अपलोड करें। हमारा एआई दवा के विवरण को तुरंत स्कैन और पहचान लेगा।",
    dragDrop: "नुस्खे की छवि को यहाँ खींचें और छोड़ें, या अपलोड करने के लिए क्लिक करें",
    supportedFormats: "PNG, JPG, JPEG का समर्थन करता है",
    ocrInit: "ओसीआर इंजन प्रारंभ हो रहा है...",
    ocrProgress: "पाठ की पहचान की जा रही है...",
    ocrSuccess: "ओसीआर पूर्ण! निकाले गए पाठ का विश्लेषण किया गया।",
    ocrNoMeds: "हमने पाठ तो पढ़ा, लेकिन किसी दवा के नाम की पहचान नहीं हो सकी। कृपया स्पष्ट तस्वीर अपलोड करें या मैन्युअल खोजें।",
    ocrMedsFound: "पहचानी गई दवाएं",
    ocrViewClinicalInfo: "विवरण देखें",
    rawText: "निकाला गया कच्चा पाठ",

    // Dashboard
    dashTitle: "विटल्स और लक्षण डैशबोर्ड",
    dashSubtitle: "अपने दैनिक स्वास्थ्य मेट्रिक्स को रिकॉर्ड करें और समय के साथ रुझानों की निगरानी करें।",
    logVitals: "विटल्स रिकॉर्ड करें",
    heartRate: "हृदय गति (Heart Rate)",
    bloodPressure: "रक्तचाप (Blood Pressure)",
    bloodSugar: "रक्त शर्करा (Blood Sugar)",
    bodyTemp: "शरीर का तापमान",
    systolic: "सिस्टोलिक (Systolic)",
    diastolic: "डायस्टोलिक (Diastolic)",
    saveVitals: "विटल्स सहेजें",
    logSymptoms: "लक्षण रिकॉर्ड करें",
    symptomSeverity: "लक्षण की गंभीरता (1-10)",
    notes: "नोट्स / विवरण",
    saveSymptom: "लॉग सहेजें",
    statsSummary: "स्वास्थ्य आँकड़े सारांश",
    avgHeartRate: "औसत हृदय गति",
    latestBp: "नवीनतम बीपी स्थिति",
    maxSugar: "अधिकतम शर्करा",
    avgTemp: "औसत तापमान",
    normal: "सामान्य",
    prehypertensive: "प्रीहाइपरटेंसिव",
    hypertensive: "उच्च (हाइपरटेंशन)",
    highSugarAlert: "उच्च शर्करा चेतावनी (>140 mg/dL)",
    feverAlert: "बुखार की चेतावनी (>=100.4°F)",
    vitalsTrends: "समय के साथ विटल्स के रुझान",
    loggedDataHistory: "स्वास्थ्य लॉग इतिहास",
    date: "तारीख",
    vitals: "विटल्स",
    severity: "गंभीरता",
    actions: "कार्रवाई",
    noVitalsLogged: "अभी तक कोई विटल्स दर्ज नहीं हैं। शुरू करने के लिए ऊपर दिया गया फॉर्म भरें।",
    noSymptomsLogged: "अभी तक कोई लक्षण दर्ज नहीं हैं।",
    clearAll: "सभी लॉग साफ करें"
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key) => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
