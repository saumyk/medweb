/**
 * Comprehensive Indian Medicine Knowledge Base
 * 
 * Curated from official & verified Indian pharmaceutical standards:
 * - CDSCO (Central Drugs Standard Control Organisation) Schedules (Schedule H, H1, X, OTC)
 * - NPPA (National Pharmaceutical Pricing Authority) Pharma Sahi Daam / DPCO ceiling prices
 * - Indian Pharmacopoeia (IP) & National List of Essential Medicines (NLEM)
 * - Standardized concept cross-references to RxNorm & US FDA / DailyMed
 */

export const INDIAN_MEDICINE_DATABASE = [
  // 1. Analgesics, Antipyretics & Anti-inflammatory
  {
    id: 'dolo-650',
    brandName: 'Dolo 650',
    genericName: 'Paracetamol (Acetaminophen) 650 mg',
    activeIngredients: [
      { name: 'Paracetamol', usName: 'acetaminophen', strength: '650 mg' }
    ],
    strength: '650 mg',
    dosageForm: 'Tablet',
    route: 'Oral',
    manufacturer: 'Micro Labs Ltd',
    market: 'India (CDSCO / NPPA)',
    schedule: 'OTC (Non-Scheduled)',
    cdscoStatus: 'CDSCO Approved · Monographed in Indian Pharmacopoeia (IP)',
    nppaPricing: {
      ceilingPrice: '₹2.04 / tablet',
      mrp: '₹30.70 (Strip of 15 tablets)',
      packSize: '15 tablets per strip',
      source: 'NPPA Pharma Sahi Daam (DPCO)'
    },
    category: 'Antipyretic & Analgesic',
    indication: 'High fever, acute headache, body aches, symptomatic relief in viral flu, and post-vaccination fever.',
    description: [
      'Fast-acting antipyretic and analgesic tablet formulated to lower body temperature and relieve mild-to-moderate pain.',
      'Acts centrally by inhibiting prostaglandin synthesis in the central nervous system and resetting the hypothalamic thermoregulatory center.',
      'One of India\'s most widely trusted and prescribed fever relief medications.'
    ],
    instructions: 'Take 1 tablet after food with a glass of water. Maintain a minimum gap of 4 to 6 hours between doses. Maximum 4 tablets (2600 mg) per 24 hours.',
    standardDosage: '650 mg every 6 hours as needed (SOS). Maximum 2600 mg daily in adults.',
    boxedWarning: 'Liver Warning: Exceeding 4000 mg of paracetamol daily from all sources can cause severe hepatotoxicity or liver failure. Avoid concurrent intake of other paracetamol-containing medications.',
    precautions: [
      'Do not consume alcohol while taking this medicine due to compounded risk of liver toxicity.',
      'Exercise caution in patients with existing hepatic impairment or severe renal dysfunction.',
      'Consult a physician if fever persists beyond 3 days or pain lasts more than 5 days.'
    ],
    doNotUse: [
      'Severe liver failure or acute hepatic disease',
      'Known hypersensitivity or allergic reaction to paracetamol / acetaminophen'
    ],
    interactions: [
      'Warfarin / oral anticoagulants: regular prolonged use may enhance anticoagulant effect.',
      'Cholestyramine: reduces rate of absorption.',
      'Metoclopramide / Domperidone: enhances rate of absorption.'
    ],
    sideEffects: ['Mild nausea', 'Sweating during fever defervescence', 'Transient stomach upset (rare)'],
    pharmacokinetics: 'Rapidly and almost completely absorbed from GI tract. Peak plasma concentration reached within 30-60 minutes. Hepatically metabolized and excreted via kidneys.',
    seekHelp: 'Seek emergency care immediately if skin rash, yellowing of skin/eyes (jaundice), severe nausea, dark urine, or facial swelling occurs.',
    safety: {
      alcohol: 'CAUTION',
      alcoholNote: 'Chronic alcohol intake significantly heightens hepatotoxicity risk.',
      pregnancy: 'SAFE',
      pregnancyNote: 'Considered generally compatible throughout pregnancy at therapeutic doses.',
      lactationNote: 'Excreted in human milk in small amounts; generally regarded as safe during breastfeeding.'
    },
    sources: ['CDSCO NLEM', 'NPPA Pharma Sahi Daam', 'Indian Pharmacopoeia (IP)', 'RxNorm Concept (198440)', 'openFDA'],
    aliases: [
      'dolo 650', 'dolo650', 'dollo 650', 'dolo-650', 'dolo', 'dollo',
      'paracetamol 650', 'paracetmol 650', 'paracetamol 650mg', 'paracetamol650',
      'acetaminophen 650', 'acetaminophen 650mg',
      'paracetamol', 'paracetmol', 'paracitamol', 'acetaminophen', 'pcm 650', 'pcm'
    ]
  },
  {
    id: 'crocin-500',
    brandName: 'Crocin 500',
    genericName: 'Paracetamol (Acetaminophen) 500 mg',
    activeIngredients: [
      { name: 'Paracetamol', usName: 'acetaminophen', strength: '500 mg' }
    ],
    strength: '500 mg',
    dosageForm: 'Tablet',
    route: 'Oral',
    manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd',
    market: 'India (CDSCO / NPPA)',
    schedule: 'OTC (Non-Scheduled)',
    cdscoStatus: 'CDSCO Approved · NLEM Listed',
    nppaPricing: {
      ceilingPrice: '₹1.01 / tablet',
      mrp: '₹15.20 (Strip of 15 tablets)',
      packSize: '15 tablets per strip',
      source: 'NPPA Pharma Sahi Daam (DPCO)'
    },
    category: 'Antipyretic & Analgesic',
    indication: 'Mild to moderate fever, tension headache, dental pain, earache, musculoskeletal pain.',
    description: [
      'Standard 500 mg paracetamol formulation providing predictable analgesia and fever reduction.',
      'Gentle on the stomach when taken as directed compared to traditional NSAIDs.'
    ],
    instructions: 'Take 1 to 2 tablets every 4 to 6 hours after meals as needed. Do not exceed 8 tablets (4000 mg) per 24 hours.',
    standardDosage: '500 mg to 1000 mg every 4-6 hours as needed.',
    boxedWarning: null,
    precautions: [
      'Do not take with other medicines containing paracetamol.',
      'Exercise caution if malnourished or suffering from chronic alcohol abuse.'
    ],
    doNotUse: ['Severe active liver failure', 'Known paracetamol allergy'],
    interactions: ['Warfarin', 'Isoniazid', 'Carbamazepine'],
    sideEffects: ['Mild gastric distress in sensitive individuals', 'Skin rash (very rare)'],
    pharmacokinetics: 'Well absorbed from upper gastrointestinal tract with onset within 30 minutes.',
    seekHelp: 'Consult doctor if symptoms worsen or fever remains above 38.5°C after 48 hours.',
    safety: {
      alcohol: 'CAUTION',
      alcoholNote: 'Avoid combining with alcohol to protect liver.',
      pregnancy: 'SAFE',
      pregnancyNote: 'Preferred first-line analgesic during pregnancy.',
      lactationNote: 'Compatible with nursing mothers.'
    },
    sources: ['CDSCO', 'NPPA Pharma Sahi Daam', 'RxNorm', 'openFDA'],
    aliases: [
      'crocin 500', 'crocin500', 'crocin', 'crocine', 'crocin advance',
      'calpol 500', 'calpol', 'paracetamol 500', 'paracetamol 500mg', 'paracetmol 500'
    ]
  },
  {
    id: 'crocin-650',
    brandName: 'Crocin 650',
    genericName: 'Paracetamol (Acetaminophen) 650 mg',
    activeIngredients: [
      { name: 'Paracetamol', usName: 'acetaminophen', strength: '650 mg' }
    ],
    strength: '650 mg',
    dosageForm: 'Tablet',
    route: 'Oral',
    manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd',
    market: 'India (CDSCO / NPPA)',
    schedule: 'OTC (Non-Scheduled)',
    cdscoStatus: 'CDSCO Approved · NLEM Listed',
    nppaPricing: {
      ceilingPrice: '₹2.04 / tablet',
      mrp: '₹30.50 (Strip of 15 tablets)',
      packSize: '15 tablets per strip',
      source: 'NPPA Pharma Sahi Daam'
    },
    category: 'Antipyretic & Analgesic',
    indication: 'High fever, viral fever, severe headache, toothache, muscle aches.',
    description: [
      'Higher strength fast-acting paracetamol formulation designed for stubborn fever and severe ache.',
      'Optizorb fast-release technology delivers onset of pain relief in 15 minutes.'
    ],
    instructions: 'Take 1 tablet every 6 hours after meals. Do not exceed 4 tablets in 24 hours.',
    standardDosage: '650 mg TDS or SOS.',
    boxedWarning: 'Exceeding 4000 mg paracetamol daily can cause severe liver damage.',
    precautions: ['Do not combine with other paracetamol products.', 'Liver caution.'],
    doNotUse: ['Severe liver failure', 'Paracetamol allergy'],
    interactions: ['Warfarin', 'Phenytoin'],
    sideEffects: ['Mild nausea', 'Dizziness'],
    pharmacokinetics: 'Fast oral absorption with 30-minute peak.',
    seekHelp: 'Seek medical attention if fever exceeds 3 days.',
    safety: {
      alcohol: 'CAUTION',
      alcoholNote: 'Avoid alcohol.',
      pregnancy: 'SAFE',
      pregnancyNote: 'Safe under medical guidance.',
      lactationNote: 'Safe during breastfeeding.'
    },
    sources: ['CDSCO', 'NPPA', 'RxNorm'],
    aliases: ['crocin 650', 'crocin650', 'crocin 650mg', 'crocin advance 650']
  },
  {
    id: 'combiflam',
    brandName: 'Combiflam',
    genericName: 'Ibuprofen 400 mg + Paracetamol 325 mg',
    activeIngredients: [
      { name: 'Ibuprofen', usName: 'ibuprofen', strength: '400 mg' },
      { name: 'Paracetamol', usName: 'acetaminophen', strength: '325 mg' }
    ],
    strength: '400 mg + 325 mg',
    dosageForm: 'Tablet',
    route: 'Oral',
    manufacturer: 'Sanofi India Ltd',
    market: 'India (CDSCO / NPPA)',
    schedule: 'Schedule H (Prescription Required)',
    cdscoStatus: 'CDSCO Approved Fixed Dose Combination (FDC)',
    nppaPricing: {
      ceilingPrice: '₹2.10 / tablet',
      mrp: '₹42.30 (Strip of 20 tablets)',
      packSize: '20 tablets per strip',
      source: 'NPPA Pharma Sahi Daam'
    },
    category: 'Dual NSAID & Analgesic Anti-inflammatory',
    indication: 'Moderate to severe headache, toothache, dental extraction pain, muscular sprain, joint swelling, menstrual cramps.',
    description: [
      'Synergistic combination of Ibuprofen (anti-inflammatory NSAID) and Paracetamol (central analgesic/antipyretic).',
      'Provides superior pain relief over single-agent analgesics for acute inflammatory conditions.'
    ],
    instructions: 'Always take strictly after food or with milk to protect gastric mucosa. Swallow whole with a full glass of water.',
    standardDosage: '1 tablet 2 to 3 times daily after food. Shortest duration necessary.',
    boxedWarning: 'Cardiovascular & Gastrointestinal Risk: NSAIDs may increase the risk of serious GI bleeding, ulceration, and perforation. Use caution in elderly patients.',
    precautions: [
      'Strictly avoid on an empty stomach.',
      'Contraindicated in patients with active peptic ulcer or history of GI bleeding.',
      'Do not co-prescribe with other Paracetamol or NSAID tablets.'
    ],
    doNotUse: [
      'Active gastric or duodenal ulcer',
      'Third trimester of pregnancy',
      'Severe renal or heart failure'
    ],
    interactions: [
      'Aspirin and other NSAIDs: heightened GI ulcer risk.',
      'Antihypertensives (ACE inhibitors/ARBs): attenuated blood pressure reduction.',
      'Methotrexate: increased toxicity.'
    ],
    sideEffects: ['Heartburn / acid reflux', 'Nausea', 'Abdominal pain', 'Dizziness'],
    pharmacokinetics: 'Both drugs are rapidly absorbed. Peak plasma levels achieved within 1-2 hours.',
    seekHelp: 'Stop immediately and seek urgent care if vomiting blood, passing black tarry stools, or severe abdominal pain develops.',
    safety: {
      alcohol: 'UNSAFE',
      alcoholNote: 'Significantly increases risk of stomach bleeding and ulcers.',
      pregnancy: 'UNSAFE',
      pregnancyNote: 'Strictly contraindicated in 3rd trimester (risk of premature ductus arteriosus closure).',
      lactationNote: 'Excreted in small amounts; consult doctor.'
    },
    sources: ['CDSCO FDC Registry', 'NPPA Pharma Sahi Daam', 'RxNorm Concept', 'openFDA'],
    aliases: [
      'combiflam', 'combiflm', 'combiflam tablet', 'ibuprofen paracetamol',
      'brufen plus', 'flexon', 'ibuclin', 'combiflam 400'
    ]
  },
  {
    id: 'meftal-spas',
    brandName: 'Meftal-Spas',
    genericName: 'Mefenamic Acid 250 mg + Dicyclomine Hydrochloride 10 mg',
    activeIngredients: [
      { name: 'Mefenamic Acid', usName: 'mefenamic acid', strength: '250 mg' },
      { name: 'Dicyclomine HCl', usName: 'dicyclomine', strength: '10 mg' }
    ],
    strength: '250 mg + 10 mg',
    dosageForm: 'Tablet',
    route: 'Oral',
    manufacturer: 'Blue Cross Laboratories Ltd',
    market: 'India (CDSCO / NPPA)',
    schedule: 'Schedule H (Prescription Required)',
    cdscoStatus: 'CDSCO Approved FDC',
    nppaPricing: {
      ceilingPrice: '₹4.80 / tablet',
      mrp: '₹48.00 (Strip of 10 tablets)',
      packSize: '10 tablets per strip',
      source: 'NPPA Pharma Sahi Daam'
    },
    category: 'Antispasmodic & NSAID Analgesic',
    indication: 'Abdominal spasmodic pain, severe menstrual cramps (dysmenorrhea), intestinal colic, ureteric colic.',
    description: [
      'Combines Dicyclomine (anticholinergic that relaxes smooth muscle spasms) with Mefenamic Acid (NSAID that blocks pain prostaglandins).',
      'Targeted therapy for visceral gut and uterine cramping.'
    ],
    instructions: 'Take 1 tablet after meals with water during acute spasmodic episodes. Recommended for brief 1 to 3 day cycles.',
    standardDosage: '1 tablet 2 to 3 times daily as needed (SOS).',
    boxedWarning: 'IPC Drug Safety Alert: Mefenamic Acid has been monitored by the Indian Pharmacopoeia Commission for rare Drug Reaction with Eosinophilia and Systemic Symptoms (DRESS) syndrome.',
    precautions: [
      'Caution in patients with glaucoma, urinary retention, or enlarged prostate.',
      'Do not take on an empty stomach.'
    ],
    doNotUse: ['Glaucoma', 'Myasthenia gravis', 'Obstructive GI disease', 'Severe kidney disease'],
    interactions: ['Antacids: reduce dicyclomine absorption.', 'Antidepressants / antihistamines.'],
    sideEffects: ['Dry mouth', 'Drowsiness', 'Blurred vision', 'Mild dizziness', 'Nausea'],
    pharmacokinetics: 'Fast GI absorption with antispasmodic action within 20-30 minutes.',
    seekHelp: 'Discontinue and consult doctor if high fever with skin rash or swollen lymph nodes appears.',
    safety: {
      alcohol: 'CAUTION',
      alcoholNote: 'Enhances drowsiness and dizzy spells.',
      pregnancy: 'UNSAFE',
      pregnancyNote: 'Avoid in late pregnancy.',
      lactationNote: 'Dicyclomine can suppress lactation; consult physician.'
    },
    sources: ['CDSCO', 'IPC Safety Alert', 'NPPA', 'openFDA'],
    aliases: [
      'meftal-spas', 'meftal spas', 'meftal', 'meftal-spas tablet',
      'cyclopam', 'colimex', 'spasmoproxyvon', 'mefenamic spas'
    ]
  },
  {
    id: 'zerodol-sp',
    brandName: 'Zerodol-SP',
    genericName: 'Aceclofenac 100 mg + Paracetamol 325 mg + Serratiopeptidase 15 mg',
    activeIngredients: [
      { name: 'Aceclofenac', usName: 'aceclofenac', strength: '100 mg' },
      { name: 'Paracetamol', usName: 'acetaminophen', strength: '325 mg' },
      { name: 'Serratiopeptidase', usName: 'serrapeptase', strength: '15 mg' }
    ],
    strength: '100 mg + 325 mg + 15 mg',
    dosageForm: 'Tablet',
    route: 'Oral',
    manufacturer: 'Ipca Laboratories Ltd',
    market: 'India (CDSCO / NPPA)',
    schedule: 'Schedule H (Prescription Required)',
    cdscoStatus: 'CDSCO Approved Triple FDC',
    nppaPricing: {
      ceilingPrice: '₹11.20 / tablet',
      mrp: '₹112.50 (Strip of 10 tablets)',
      packSize: '10 tablets per strip',
      source: 'NPPA Pharma Sahi Daam'
    },
    category: 'Triple Anti-inflammatory, Analgesic & Proteolytic Enzyme',
    indication: 'Severe inflammatory pain, post-operative dental pain, bone fracture trauma, arthritis flare-up, sports injury with edema.',
    description: [
      'Potent triple combination: Aceclofenac provides preferential COX-2 pain relief, Paracetamol accelerates analgesic onset, and Serratiopeptidase breaks down inflammatory exudates and swelling.',
      'Promotes faster tissue repair and resolves localized hematomas.'
    ],
    instructions: 'Take 1 tablet twice daily after food with a glass of water. Swallow whole; do not break or crush.',
    standardDosage: '1 tablet morning and night (1-0-1) after meals for 3 to 5 days.',
    boxedWarning: 'Do not take with other NSAIDs or Paracetamol tablets to prevent compounding liver and kidney burden.',
    precautions: ['Monitor renal and liver profiles during extended therapy.', 'Contraindicated in peptic ulcer.'],
    doNotUse: ['Active stomach ulcer', 'Severe cardiac failure', 'Known aceclofenac allergy'],
    interactions: ['Lithium', 'Digoxin', 'Methotrexate', 'Anticoagulants'],
    sideEffects: ['Dyspepsia', 'Nausea', 'Loose stools', 'Drowsiness'],
    pharmacokinetics: 'Aceclofenac rapidly absorbed with peak at 1.5-3 hrs. Serratiopeptidase reaches inflamed tissues through intestinal lymphatic absorption.',
    seekHelp: 'Seek care if black tarry stools, allergic hives, or abdominal pain occurs.',
    safety: {
      alcohol: 'UNSAFE',
      alcoholNote: 'Increases danger of gastric erosion and liver stress.',
      pregnancy: 'UNSAFE',
      pregnancyNote: 'Contraindicated throughout pregnancy unless specifically advised.',
      lactationNote: 'Not recommended during nursing.'
    },
    sources: ['CDSCO Approved List', 'NPPA Pharma Sahi Daam', 'Indian Pharmacopoeia'],
    aliases: [
      'zerodol-sp', 'zerodol sp', 'zerodol', 'zerodol-p',
      'aceclofenac paracetamol serratiopeptidase', 'hifenac-sp', 'chymo-sp', 'signoflam'
    ]
  },
  {
    id: 'disprin',
    brandName: 'Disprin',
    genericName: 'Aspirin (Acetylsalicylic Acid) 350 mg',
    activeIngredients: [
      { name: 'Aspirin', usName: 'aspirin', strength: '350 mg' }
    ],
    strength: '350 mg',
    dosageForm: 'Effervescent Tablet',
    route: 'Oral (Dissolve in water)',
    manufacturer: 'Reckitt Benckiser India Ltd',
    market: 'India (CDSCO / NPPA)',
    schedule: 'OTC (Non-Scheduled)',
    cdscoStatus: 'CDSCO Approved · Soluble Aspirin',
    nppaPricing: {
      ceilingPrice: '₹1.15 / tablet',
      mrp: '₹11.50 (Strip of 10 tablets)',
      packSize: '10 tablets per strip',
      source: 'NPPA Pharma Sahi Daam'
    },
    category: 'Salicylate Analgesic & Anti-inflammatory',
    indication: 'Fast relief from severe headache, migraine attack, toothache, neuralgic pain, and fever.',
    description: [
      'Soluble effervescent formulation of acetylsalicylic acid that dissolves completely in water for swift gastrointestinal absorption.',
      'Rapid onset pain relief within 10 to 15 minutes.'
    ],
    instructions: 'Dissolve 1 to 2 tablets completely in half a glass of drinking water and drink immediately after food.',
    standardDosage: '350 mg to 700 mg dissolved in water every 4 to 6 hours as needed.',
    boxedWarning: 'Reye\'s Syndrome Warning: Never administer to children or adolescents under 16 years recovering from viral illnesses (chickenpox, flu) due to risk of fatal Reye\'s Syndrome.',
    precautions: ['Avoid in asthma patients prone to bronchospasm.', 'Avoid before planned surgical procedures.'],
    doNotUse: ['Children under 16', 'Active peptic ulcer', 'Bleeding disorders / Hemophilia'],
    interactions: ['Warfarin and blood thinners', 'Methotrexate', 'SSRIs'],
    sideEffects: ['Gastric irritation', 'Heartburn', 'Tinnitus (ringing in ears with high dose)'],
    pharmacokinetics: 'Rapidly absorbed in stomach and upper small intestine; hydrolyzed to active salicylate.',
    seekHelp: 'Emergency care needed if ringing in ears, dark vomiting, or shortness of breath occurs.',
    safety: {
      alcohol: 'UNSAFE',
      alcoholNote: 'Heavy alcohol use with aspirin significantly heightens GI hemorrhage risk.',
      pregnancy: 'UNSAFE',
      pregnancyNote: 'Avoid especially in third trimester.',
      lactationNote: 'Excreted in breast milk; use alternative analgesic.'
    },
    sources: ['CDSCO', 'NPPA', 'RxNorm Concept', 'openFDA'],
    aliases: ['disprin', 'disprin 350', 'aspirin', 'soluble aspirin', 'acetylsalicylic acid']
  },

  // 2. Antibiotics & Antimicrobials
  {
    id: 'augmentin-625',
    brandName: 'Augmentin 625 Duo',
    genericName: 'Amoxicillin 500 mg + Clavulanic Acid 125 mg',
    activeIngredients: [
      { name: 'Amoxicillin', usName: 'amoxicillin', strength: '500 mg' },
      { name: 'Clavulanic Acid', usName: 'clavulanate', strength: '125 mg' }
    ],
    strength: '625 mg (500 mg + 125 mg)',
    dosageForm: 'Tablet',
    route: 'Oral',
    manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd',
    market: 'India (CDSCO / NPPA)',
    schedule: 'Schedule H1 (High-Alert Antibiotic)',
    cdscoStatus: 'CDSCO Approved · Schedule H1 Registered',
    nppaPricing: {
      ceilingPrice: '₹20.45 / tablet',
      mrp: '₹204.50 (Strip of 10 tablets)',
      packSize: '10 tablets per strip',
      source: 'NPPA Pharma Sahi Daam'
    },
    category: 'Broad-Spectrum Penicillin with Beta-Lactamase Inhibitor',
    indication: 'Bacterial sinusitis, lower respiratory infections, community-acquired pneumonia, acute otitis media, skin & soft tissue infections, dental abscesses, UTIs.',
    description: [
      'Amoxicillin provides broad-spectrum bactericidal action, while Potassium Clavulanate irreversibly inactivates beta-lactamase enzymes produced by resistant bacteria.',
      'Restores penicillin sensitivity against beta-lactamase producing strains of H. influenzae, M. catarrhalis, S. aureus, and E. coli.'
    ],
    instructions: 'Take strictly at the start of a meal or immediately after food to minimize GI intolerance. Maintain equal 12-hour dosing intervals. Always complete the entire prescribed 5 to 7 day course.',
    standardDosage: '1 tablet twice daily (1-0-1) every 12 hours for 5 to 7 days.',
    boxedWarning: 'Schedule H1 Warning: Under the Drugs and Cosmetics Rules, this antibiotic requires a registered doctor\'s prescription and must be entered into a separate Schedule H1 audit register to combat AMR.',
    precautions: [
      'Check for prior penicillin or cephalosporin allergy before starting.',
      'Ensure complete course compliance to prevent antimicrobial resistance (AMR).',
      'Maintain adequate hydration during treatment.'
    ],
    doNotUse: [
      'History of penicillin allergy or severe anaphylaxis',
      'History of amoxicillin/clavulanate-associated cholestatic jaundice or liver impairment'
    ],
    interactions: [
      'Oral anticoagulants (Warfarin): prolongation of prothrombin time.',
      'Methotrexate: amoxicillin decreases clearance, increasing toxicity.',
      'Probenecid: increases amoxicillin blood levels.'
    ],
    sideEffects: ['Diarrhea / loose stools', 'Nausea / vomiting', 'Mild abdominal cramping', 'Skin rash / urticaria', 'Oral thrush'],
    pharmacokinetics: 'Both components are well absorbed from GI tract when taken at the beginning of meals. Distributed widely across body fluids and excreted primarily via kidneys.',
    seekHelp: 'Discontinue immediately and call emergency if facial swelling, wheezing, severe blistering skin rash, or watery profuse diarrhea develops.',
    safety: {
      alcohol: 'CAUTION',
      alcoholNote: 'Alcohol weakens immune recovery and compounds gastric nausea.',
      pregnancy: 'SAFE',
      pregnancyNote: 'Generally compatible in pregnancy under doctor\'s prescription.',
      lactationNote: 'Excreted in trace amounts in breast milk; monitor infant for diarrhea.'
    },
    sources: ['CDSCO Schedule H1 List', 'NPPA Pharma Sahi Daam', 'Indian Pharmacopoeia (IP)', 'RxNorm Concept', 'openFDA'],
    aliases: [
      'augmentin 625 duo', 'augmentin 625', 'augmentin625', 'augmentin',
      'clavam 625', 'clavam625', 'clavam', 'moxikind-cv 625', 'moxikind-cv',
      'amoxyclav 625', 'amoxicillin clavulanate', 'amoxicillin and clavulanate potassium'
    ]
  },
  {
    id: 'amoxicillin-500',
    brandName: 'Amoxicillin 500',
    genericName: 'Amoxicillin Trihydrate 500 mg',
    activeIngredients: [
      { name: 'Amoxicillin', usName: 'amoxicillin', strength: '500 mg' }
    ],
    strength: '500 mg',
    dosageForm: 'Capsule',
    route: 'Oral',
    manufacturer: 'Various (Alkem / Cipla / Mankind / Abbott)',
    market: 'India (CDSCO / NPPA)',
    schedule: 'Schedule H1 (High-Alert Antibiotic)',
    cdscoStatus: 'CDSCO Approved · Schedule H1',
    nppaPricing: {
      ceilingPrice: '₹7.20 / capsule',
      mrp: '₹72.00 (Strip of 10 capsules)',
      packSize: '10 capsules per strip',
      source: 'NPPA Pharma Sahi Daam'
    },
    category: 'Penicillin Antibiotic',
    indication: 'Streptococcal pharyngitis, acute otitis media, chest infections, dental infections, uncomplicated gonorrhea, H. pylori eradication regimen.',
    description: [
      'Core broad-spectrum aminopenicillin antibiotic that inhibits bacterial cell wall synthesis.',
      'Active against both Gram-positive and select Gram-negative organisms.'
    ],
    instructions: 'Take 1 capsule every 8 hours with water. Can be taken with or without food. Complete the full prescribed course.',
    standardDosage: '500 mg every 8 hours (TDS) for 5 to 7 days.',
    boxedWarning: 'Schedule H1: Antibiotic stewardship required. Misuse leads to multi-drug resistance.',
    precautions: ['Check for penicillin hypersensitivity.', 'Caution in patients with infectious mononucleosis (rash risk).'],
    doNotUse: ['Penicillin hypersensitivity', 'Infectious mononucleosis'],
    interactions: ['Allopurinol: increased risk of skin rash.', 'Oral contraceptives.'],
    sideEffects: ['Loose stools', 'Nausea', 'Skin rash', 'Headache'],
    pharmacokinetics: 'Rapidly absorbed with peak blood concentrations at 1-2 hours.',
    seekHelp: 'Discontinue and seek medical care if hives, wheezing, or persistent diarrhea develops.',
    safety: {
      alcohol: 'CAUTION',
      alcoholNote: 'Avoid alcohol during active bacterial infections.',
      pregnancy: 'SAFE',
      pregnancyNote: 'Widely used and considered safe during pregnancy.',
      lactationNote: 'Compatible with breastfeeding.'
    },
    sources: ['CDSCO', 'NPPA', 'RxNorm', 'openFDA'],
    aliases: [
      'amoxicillin 500', 'amoxicillin', 'amoxacillin', 'amoxycillin',
      'amoxil 500', 'novamox 500', 'mox 500'
    ]
  },
  {
    id: 'azithral-500',
    brandName: 'Azithral 500',
    genericName: 'Azithromycin Dihydrate 500 mg',
    activeIngredients: [
      { name: 'Azithromycin', usName: 'azithromycin', strength: '500 mg' }
    ],
    strength: '500 mg',
    dosageForm: 'Tablet',
    route: 'Oral',
    manufacturer: 'Alembic Pharmaceuticals Ltd',
    market: 'India (CDSCO / NPPA)',
    schedule: 'Schedule H1 (High-Alert Antibiotic)',
    cdscoStatus: 'CDSCO Approved · Schedule H1',
    nppaPricing: {
      ceilingPrice: '₹23.50 / tablet',
      mrp: '₹117.50 (Strip of 5 tablets)',
      packSize: '5 tablets per strip',
      source: 'NPPA Pharma Sahi Daam'
    },
    category: 'Macrolide Antibiotic',
    indication: 'Bacterial pharyngitis, acute bacterial sinusitis, community-acquired bronchitis, skin infections, genital chlamydial infections, typhoid fever (second line).',
    description: [
      'Semisynthetic azalide macrolide antibiotic with extensive tissue penetration and high intracellular concentration.',
      'Inhibits bacterial protein synthesis by binding to 50S ribosomal subunit. Famous for convenient once-daily 3 to 5 day dosage.'
    ],
    instructions: 'Take once daily at the same time every day. Best taken 1 hour before or 2 hours after meals with water. Complete full 3-day or 5-day cycle.',
    standardDosage: '500 mg once daily (1-0-0) for 3 consecutive days or 500 mg Day 1 followed by 250 mg Days 2-5.',
    boxedWarning: 'Cardiovascular Safety: Azithromycin can cause abnormal changes in cardiac electrical activity (QT interval prolongation). Use caution in patients with known arrhythmias or electrolyte imbalance.',
    precautions: [
      'Do not take aluminum- or magnesium-containing antacids within 2 hours of dosing.',
      'Check ECG in patients predisposed to cardiac arrhythmias.'
    ],
    doNotUse: ['Known macrolide hypersensitivity', 'History of cholestatic jaundice with prior azithromycin use'],
    interactions: ['Antacids: reduce peak serum levels.', 'Digoxin: increases digoxin levels.', 'Warfarin.'],
    sideEffects: ['Mild diarrhea', 'Nausea / stomach cramp', 'Temporary altered taste', 'Headache'],
    pharmacokinetics: 'Rapidly absorbed, rapidly clears from plasma into tissues with terminal elimination half-life of 68 hours.',
    seekHelp: 'Seek prompt medical attention if palpitations, severe dizziness, yellowing of eyes, or severe abdominal pain occurs.',
    safety: {
      alcohol: 'CAUTION',
      alcoholNote: 'Avoid alcohol during antibiotic therapy.',
      pregnancy: 'SAFE',
      pregnancyNote: 'Generally compatible when prescribed by a physician.',
      lactationNote: 'Excreted in low levels in breast milk; consult physician.'
    },
    sources: ['CDSCO Schedule H1', 'NPPA Pharma Sahi Daam', 'RxNorm Concept', 'openFDA'],
    aliases: [
      'azithral 500', 'azithral', 'azithromycin 500', 'azithromicin', 'azithromycine',
      'zithromax', 'zady 500', 'aziwok 500', 'azimax 500'
    ]
  },
  {
    id: 'taxim-o-200',
    brandName: 'Taxim-O 200',
    genericName: 'Cefixime 200 mg',
    activeIngredients: [
      { name: 'Cefixime', usName: 'cefixime', strength: '200 mg' }
    ],
    strength: '200 mg',
    dosageForm: 'Tablet',
    route: 'Oral',
    manufacturer: 'Alkem Laboratories Ltd',
    market: 'India (CDSCO / NPPA)',
    schedule: 'Schedule H1 (High-Alert Antibiotic)',
    cdscoStatus: 'CDSCO Approved · Schedule H1',
    nppaPricing: {
      ceilingPrice: '₹10.50 / tablet',
      mrp: '₹105.00 (Strip of 10 tablets)',
      packSize: '10 tablets per strip',
      source: 'NPPA Pharma Sahi Daam'
    },
    category: '3rd Generation Cephalosporin Antibiotic',
    indication: 'Typhoid (enteric fever), complicated urinary tract infections, tonsillitis, otitis media, acute bronchitis.',
    description: [
      'Oral 3rd generation cephalosporin with excellent bactericidal stability against beta-lactamases.',
      'Highly active against Enterobacteriaceae, Salmonella typhi, Streptococcus pneumoniae, and H. influenzae.'
    ],
    instructions: 'Take 1 tablet twice daily after meals with a glass of water for 5 to 7 days.',
    standardDosage: '200 mg twice daily (1-0-1) every 12 hours for 5 to 10 days.',
    boxedWarning: 'Schedule H1: Regulated antibiotic. Complete entire prescribed cycle to prevent typhoid drug resistance.',
    precautions: ['Caution in patients allergic to cephalosporins or penicillins.', 'Dose reduction needed in severe renal failure.'],
    doNotUse: ['Severe cephalosporin hypersensitivity'],
    interactions: ['Warfarin: increases prothrombin time.', 'Carbamazepine: elevated carbamazepine levels.'],
    sideEffects: ['Diarrhea', 'Loose stool', 'Abdominal discomfort', 'Nausea'],
    pharmacokinetics: 'Oral bioavailability ~40-50%. Excreted unchanged in urine and bile.',
    seekHelp: 'Discontinue and consult doctor if persistent watery diarrhea or skin rash occurs.',
    safety: {
      alcohol: 'CAUTION',
      alcoholNote: 'Avoid alcohol during infection recovery.',
      pregnancy: 'SAFE',
      pregnancyNote: 'FDA Category B equivalent; widely used in pregnancy.',
      lactationNote: 'Considered safe during breastfeeding.'
    },
    sources: ['CDSCO Schedule H1', 'NPPA', 'RxNorm', 'openFDA'],
    aliases: [
      'taxim-o 200', 'taxim-o', 'taxim o', 'taxim', 'cefixime 200', 'cefixime',
      'zifi 200', 'omnicef', 'cefix 200', 'mahacef 200'
    ]
  },
  {
    id: 'norflox-tz',
    brandName: 'Norflox-TZ',
    genericName: 'Norfloxacin 400 mg + Tinidazole 600 mg',
    activeIngredients: [
      { name: 'Norfloxacin', usName: 'norfloxacin', strength: '400 mg' },
      { name: 'Tinidazole', usName: 'tinidazole', strength: '600 mg' }
    ],
    strength: '400 mg + 600 mg',
    dosageForm: 'Tablet',
    route: 'Oral',
    manufacturer: 'Cipla Ltd',
    market: 'India (CDSCO / NPPA)',
    schedule: 'Schedule H1 (Prescription Required)',
    cdscoStatus: 'CDSCO Approved FDC',
    nppaPricing: {
      ceilingPrice: '₹7.90 / tablet',
      mrp: '₹79.00 (Strip of 10 tablets)',
      packSize: '10 tablets per strip',
      source: 'NPPA Pharma Sahi Daam'
    },
    category: 'Fluoroquinolone & Antiprotozoal Antibacterial',
    indication: 'Bacterial and amoebic diarrhea, acute gastroenteritis, intestinal amoebiasis, mixed bacterial/protozoal dysentery.',
    description: [
      'Synergistic combination of Norfloxacin (fluoroquinolone targeting bacterial DNA gyrase) and Tinidazole (nitroimidazole active against anaerobic protozoa like Entamoeba histolytica and Giardia lamblia).',
      'First-line treatment for infectious traveller\'s diarrhea and dysentery in India.'
    ],
    instructions: 'Take 1 tablet twice daily after meals with plenty of water for 3 to 5 days. Maintain adequate oral hydration with ORS.',
    standardDosage: '1 tablet twice daily (1-0-1) for 3 to 5 days.',
    boxedWarning: 'Alcohol Prohibition Warning: Absolutely do NOT drink alcohol while taking Tinidazole and for at least 48 hours after the last dose, as it triggers a severe disulfiram-like reaction (violent vomiting, flushing, tachycardia).',
    precautions: [
      'Drink plenty of oral fluids to prevent crystalluria and dehydration.',
      'Fluoroquinolones may cause tendonitis or tendon rupture; avoid strenuous physical exercise during treatment.'
    ],
    doNotUse: ['First trimester of pregnancy', 'Known fluoroquinolone or nitroimidazole allergy', 'History of tendon rupture'],
    interactions: ['Alcohol (severe reaction)', 'Antacids (magnesium/aluminum reduce absorption)', 'Theophylline'],
    sideEffects: ['Metallic taste in mouth', 'Darkened urine', 'Mild nausea', 'Headache'],
    pharmacokinetics: 'Rapidly absorbed from gastrointestinal tract with high intestinal lumen concentration.',
    seekHelp: 'Seek immediate care if tendon pain, neurological tingling, or persistent vomiting develops.',
    safety: {
      alcohol: 'UNSAFE',
      alcoholNote: 'STRICTLY FORBIDDEN: triggers violent disulfiram-like vomiting and palpitations.',
      pregnancy: 'UNSAFE',
      pregnancyNote: 'Contraindicated in pregnancy.',
      lactationNote: 'Tinidazole passes into breast milk; withhold nursing for 3 days post-dose.'
    },
    sources: ['CDSCO Schedule H1', 'NPPA Pharma Sahi Daam', 'RxNorm Concept', 'openFDA'],
    aliases: [
      'norflox-tz', 'norflox tz', 'norflox', 'norfloxacin tinidazole',
      'norflox 400', 'metrogyl', 'flagyl'
    ]
  },

  // 3. Gastrointestinal & Acid Peptic Disorders
  {
    id: 'pantocid-40',
    brandName: 'Pantocid 40',
    genericName: 'Pantoprazole Sodium 40 mg',
    activeIngredients: [
      { name: 'Pantoprazole', usName: 'pantoprazole', strength: '40 mg' }
    ],
    strength: '40 mg',
    dosageForm: 'Enteric-Coated Tablet',
    route: 'Oral',
    manufacturer: 'Sun Pharmaceutical Industries Ltd',
    market: 'India (CDSCO / NPPA)',
    schedule: 'Schedule H (Prescription Required)',
    cdscoStatus: 'CDSCO Approved · NLEM Listed',
    nppaPricing: {
      ceilingPrice: '₹9.80 / tablet',
      mrp: '₹147.00 (Strip of 15 tablets)',
      packSize: '15 tablets per strip',
      source: 'NPPA Pharma Sahi Daam'
    },
    category: 'Proton Pump Inhibitor (PPI)',
    indication: 'Gastroesophageal reflux disease (GERD), acid peptic disease, erosive esophagitis, prevention of NSAID-induced gastric ulcers, Zollinger-Ellison syndrome.',
    description: [
      'Irreversibly inhibits the hydrogen-potassium ATPase pump (the proton pump) in gastric parietal cells.',
      'Suppresses both basal and stimulated gastric acid secretion regardless of stimulus, accelerating mucosal healing.'
    ],
    instructions: 'Take 1 tablet in the morning on an empty stomach at least 30 to 45 minutes before breakfast with a glass of water. Swallow whole; do not chew or crush.',
    standardDosage: '40 mg once daily (1-0-0) in the morning for 4 to 8 weeks.',
    boxedWarning: null,
    precautions: [
      'Long-term continuous therapy (>1 year) can reduce absorption of Vitamin B12, magnesium, and calcium.',
      'Symptomatic response does not preclude gastric malignancy.'
    ],
    doNotUse: ['Known hypersensitivity to pantoprazole or substituted benzimidazoles'],
    interactions: ['Ketoconazole / Itraconazole: reduced antifungal absorption.', 'Methotrexate.', 'Atazanavir.'],
    sideEffects: ['Mild headache', 'Diarrhea / soft stools', 'Abdominal bloating / flatulence', 'Dry mouth'],
    pharmacokinetics: 'Acid-labile enteric-coated formulation. Peak serum concentrations reached ~2.5 hours post-dose. Hepatically metabolized via CYP2C19.',
    seekHelp: 'Consult doctor if severe persistent watery diarrhea, unexplained bone pain, or muscle twitching occurs.',
    safety: {
      alcohol: 'CAUTION',
      alcoholNote: 'Alcohol irritates stomach lining and triggers excess acid secretion.',
      pregnancy: 'SAFE',
      pregnancyNote: 'FDA Category B equivalent; used when clinically indicated under doctor guidance.',
      lactationNote: 'Excreted in small amounts in breast milk; consult physician.'
    },
    sources: ['CDSCO NLEM', 'NPPA Pharma Sahi Daam', 'RxNorm Concept (284635)', 'openFDA'],
    aliases: [
      'pantocid 40', 'pantocid40', 'pantocid', 'pantop 40', 'pantop40', 'pantop',
      'pantoprazole 40 mg', 'pantoprazol 40 mg', 'pantoprazole 40mg', 'pantoprazol 40mg',
      'pantoprazole', 'pantoprazol', 'pantaprazole', 'pan 40', 'pan40', 'pantodac 40'
    ]
  },
  {
    id: 'pan-d',
    brandName: 'Pan-D',
    genericName: 'Pantoprazole 40 mg + Domperidone 30 mg SR',
    activeIngredients: [
      { name: 'Pantoprazole', usName: 'pantoprazole', strength: '40 mg' },
      { name: 'Domperidone SR', usName: 'domperidone', strength: '30 mg' }
    ],
    strength: '40 mg + 30 mg SR',
    dosageForm: 'Sustained-Release Capsule',
    route: 'Oral',
    manufacturer: 'Alkem Laboratories Ltd',
    market: 'India (CDSCO / NPPA)',
    schedule: 'Schedule H (Prescription Required)',
    cdscoStatus: 'CDSCO Approved FDC',
    nppaPricing: {
      ceilingPrice: '₹14.50 / capsule',
      mrp: '₹217.50 (Strip of 15 capsules)',
      packSize: '15 capsules per strip',
      source: 'NPPA Pharma Sahi Daam'
    },
    category: 'PPI with Prokinetic Anti-emetic',
    indication: 'Gastroesophageal reflux disease (GERD) with nausea, refractory heartburn, delayed gastric emptying, acid dyspepsia, bloating and sour belching.',
    description: [
      'Combines Pantoprazole (inhibits gastric acid) with sustained-release Domperidone (dopamine D2 receptor antagonist that increases lower esophageal sphincter tone and accelerates gastric emptying).',
      'Prevents retrograde acid reflux and nausea.'
    ],
    instructions: 'Take 1 capsule once daily in the morning on an empty stomach at least 30 to 45 minutes before breakfast. Swallow whole.',
    standardDosage: '1 capsule daily in the morning (1-0-0) on an empty stomach.',
    boxedWarning: 'Cardiac Precaution: Domperidone has been associated with prolongation of QT interval. Use caution in patients with underlying cardiac history or cardiac arrhythmias.',
    precautions: [
      'Take strictly before meals.',
      'Avoid long-term unmonitored use.',
      'Caution in elderly patients with electrolyte disturbances.'
    ],
    doNotUse: ['GI hemorrhage or mechanical bowel obstruction', 'Prolonged QT interval history', 'Prolactinoma'],
    interactions: ['Ketoconazole, Erythromycin (increase domperidone levels)', 'Anticholinergics (antagonize prokinetic action)'],
    sideEffects: ['Dry mouth', 'Headache', 'Mild diarrhea', 'Somnolence'],
    pharmacokinetics: 'Domperidone provides biphasic release (10mg immediate + 20mg sustained) alongside enteric-coated pantoprazole.',
    seekHelp: 'Seek medical help if irregular heart rhythm, palpitations, or fainting occurs.',
    safety: {
      alcohol: 'CAUTION',
      alcoholNote: 'Aggravates reflux and dizziness.',
      pregnancy: 'CAUTION',
      pregnancyNote: 'Use only if potential benefit outweighs risk under doctor care.',
      lactationNote: 'Domperidone increases prolactin and passes into milk; consult doctor.'
    },
    sources: ['CDSCO FDC List', 'NPPA Pharma Sahi Daam', 'Indian Pharmacopoeia'],
    aliases: [
      'pan-d', 'pand', 'pan d', 'pantocid-d', 'pantop-d',
      'pantoprazole domperidone', 'dompan', 'pan d capsule'
    ]
  },
  {
    id: 'omez-20',
    brandName: 'Omez 20',
    genericName: 'Omeprazole 20 mg',
    activeIngredients: [
      { name: 'Omeprazole', usName: 'omeprazole', strength: '20 mg' }
    ],
    strength: '20 mg',
    dosageForm: 'Capsule',
    route: 'Oral',
    manufacturer: 'Dr. Reddy\'s Laboratories Ltd',
    market: 'India (CDSCO / NPPA)',
    schedule: 'Schedule H (Prescription Required)',
    cdscoStatus: 'CDSCO Approved · NLEM Listed',
    nppaPricing: {
      ceilingPrice: '₹3.50 / capsule',
      mrp: '₹70.00 (Strip of 20 capsules)',
      packSize: '20 capsules per strip',
      source: 'NPPA Pharma Sahi Daam'
    },
    category: 'Proton Pump Inhibitor (PPI)',
    indication: 'Duodenal ulcers, gastric ulcers, reflux esophagitis, Zollinger-Ellison syndrome, H. pylori eradication.',
    description: [
      'Foundational proton pump inhibitor that suppresses gastric acid secretion by specific inhibition of the H+/K+-ATPase enzyme.',
      'Proven mucosal healing in gastric and duodenal erosions.'
    ],
    instructions: 'Take 1 capsule in the morning on an empty stomach with a glass of water, 30 minutes before food.',
    standardDosage: '20 mg once daily (1-0-0) for 2 to 4 weeks.',
    boxedWarning: null,
    precautions: ['Caution with long-term use (hypomagnesemia risk).'],
    doNotUse: ['Known hypersensitivity to omeprazole'],
    interactions: ['Clopidogrel: omeprazole may reduce antiplatelet efficacy of clopidogrel (CYP2C19 competition).', 'Diazepam.'],
    sideEffects: ['Headache', 'Flatulence', 'Mild diarrhea', 'Nausea'],
    pharmacokinetics: 'Bioavailability ~30-40%; peak plasma concentration in 0.5-3.5 hours.',
    seekHelp: 'Contact doctor if swallowing difficulty, persistent vomiting, or unexplained weight loss occurs.',
    safety: {
      alcohol: 'CAUTION',
      alcoholNote: 'Avoid alcohol during ulcer healing.',
      pregnancy: 'SAFE',
      pregnancyNote: 'Extensively studied; generally regarded as safe.',
      lactationNote: 'Excreted in low levels in breast milk.'
    },
    sources: ['CDSCO', 'NPPA', 'RxNorm Concept', 'openFDA'],
    aliases: ['omez 20', 'omez', 'omeprazole 20', 'omeprazole 20mg', 'omeprazol 20', 'omeprazole', 'omeprazol']
  },
  {
    id: 'aciloc-150',
    brandName: 'Aciloc 150',
    genericName: 'Ranitidine Hydrochloride 150 mg',
    activeIngredients: [
      { name: 'Ranitidine', usName: 'ranitidine', strength: '150 mg' }
    ],
    strength: '150 mg',
    dosageForm: 'Tablet',
    route: 'Oral',
    manufacturer: 'Cadila Pharmaceuticals Ltd',
    market: 'India (CDSCO / NPPA)',
    schedule: 'Schedule H (Prescription Required)',
    cdscoStatus: 'CDSCO Monitored Formulation',
    nppaPricing: {
      ceilingPrice: '₹1.40 / tablet',
      mrp: '₹42.00 (Strip of 30 tablets)',
      packSize: '30 tablets per strip',
      source: 'NPPA Pharma Sahi Daam'
    },
    category: 'Histamine H2 Receptor Antagonist',
    indication: 'Heartburn, hyperacidity, nocturnal acid breakthrough, stress ulcer prophylaxis, peptic ulcer.',
    description: [
      'Competitive, reversible inhibitor of histamine at gastric H2 receptors.',
      'Reduces volume and hydrogen ion concentration of gastric secretions.'
    ],
    instructions: 'Take 1 tablet twice daily (morning and bedtime) or 300 mg at bedtime, with or without meals.',
    standardDosage: '150 mg twice daily (1-0-1).',
    boxedWarning: 'Regulatory Advisory: Formulations strictly monitored and tested for NDMA nitrosamine impurity levels per CDSCO and international drug safety directives.',
    precautions: ['Adjust dose in patients with renal impairment.'],
    doNotUse: ['Known ranitidine allergy'],
    interactions: ['Procainamide', 'Warfarin'],
    sideEffects: ['Headache', 'Dizziness', 'Constipation / diarrhea'],
    pharmacokinetics: 'Well absorbed from GI tract; ~50% oral bioavailability.',
    seekHelp: 'Consult doctor if persistent gastric pain occurs.',
    safety: {
      alcohol: 'CAUTION',
      alcoholNote: 'Avoid alcohol.',
      pregnancy: 'CAUTION',
      pregnancyNote: 'Consult physician for safer alternatives like Famotidine or Pantoprazole.',
      lactationNote: 'Excreted in breast milk.'
    },
    sources: ['CDSCO Advisory', 'NPPA', 'RxNorm'],
    aliases: ['aciloc 150', 'aciloc', 'rantac 150', 'rantac', 'zantac', 'ranitidine 150', 'ranitidine', 'ranitadine']
  },
  {
    id: 'digene-gel',
    brandName: 'Digene Gel',
    genericName: 'Aluminium Hydroxide + Magnesium Hydroxide + Simethicone',
    activeIngredients: [
      { name: 'Magnesium Hydroxide', usName: 'magnesium hydroxide', strength: '185 mg/5ml' },
      { name: 'Aluminium Hydroxide', usName: 'aluminum hydroxide', strength: '830 mg/5ml' },
      { name: 'Simethicone', usName: 'simethicone', strength: '50 mg/5ml' }
    ],
    strength: 'Triple Antacid Formula',
    dosageForm: 'Oral Suspension / Gel',
    route: 'Oral',
    manufacturer: 'Abbott Healthcare Pvt Ltd',
    market: 'India (CDSCO / NPPA)',
    schedule: 'OTC (Non-Scheduled)',
    cdscoStatus: 'CDSCO Approved · OTC Antacid',
    nppaPricing: {
      ceilingPrice: '₹142.00 / 200ml bottle',
      mrp: '₹142.50 (200 ml Bottle)',
      packSize: '200 ml bottle',
      source: 'NPPA Pharma Sahi Daam'
    },
    category: 'Antacid & Antiflatulent',
    indication: 'Immediate relief from acid indigestion, burning chest heartburn, sour stomach, trapped gas and flatulence.',
    description: [
      'Dual hydroxide action: Magnesium hydroxide provides fast neutralizing relief while Aluminium hydroxide sustains buffer capacity and prevents magnesium-induced loose stools.',
      'Simethicone reduces surface tension of gas bubbles, coalescing them for easy belching.'
    ],
    instructions: 'Shake the bottle well before use. Take 10 to 15 ml (2 to 3 teaspoonfuls) 30 to 60 minutes after meals and before retiring to bed.',
    standardDosage: '10-15 ml TDS after meals and at bedtime.',
    boxedWarning: null,
    precautions: [
      'Do not take other oral prescription medicines within 2 hours of taking this antacid (impedes drug absorption).',
      'Avoid long-term daily use in patients with kidney disease.'
    ],
    doNotUse: ['Severe renal failure', 'Hypophosphatemia'],
    interactions: ['Tetracyclines, Fluoroquinolones, Iron supplements: binds and blocks absorption.'],
    sideEffects: ['Chalky taste', 'Altered bowel movement (mild constipation or diarrhea)'],
    pharmacokinetics: 'Acts locally within gastric lumen to neutralize hydrochloric acid. Minimal systemic absorption.',
    seekHelp: 'Consult doctor if symptoms persist after 14 days of regular use.',
    safety: {
      alcohol: 'SAFE',
      alcoholNote: 'Directly soothes alcohol-induced gastritis.',
      pregnancy: 'SAFE',
      pregnancyNote: 'Safe for pregnancy-induced heartburn when taken in moderation.',
      lactationNote: 'Compatible with nursing mothers.'
    },
    sources: ['CDSCO', 'NPPA Pharma Sahi Daam', 'RxNorm Concept', 'openFDA'],
    aliases: ['digene gel', 'digene', 'digene tablet', 'gelusil', 'mucaine', 'cremaffin', 'antacid gel']
  },

  // 4. Antihistamines & Respiratory
  {
    id: 'cetirizine-10',
    brandName: 'Cetirizine 10 mg',
    genericName: 'Cetirizine Hydrochloride 10 mg',
    activeIngredients: [
      { name: 'Cetirizine', usName: 'cetirizine', strength: '10 mg' }
    ],
    strength: '10 mg',
    dosageForm: 'Tablet',
    route: 'Oral',
    manufacturer: 'Various (Cipla / Dr. Reddy\'s / Alkem)',
    market: 'India (CDSCO / NPPA)',
    schedule: 'OTC / Schedule H (Mild)',
    cdscoStatus: 'CDSCO Approved · NLEM Listed',
    nppaPricing: {
      ceilingPrice: '₹1.95 / tablet',
      mrp: '₹22.50 (Strip of 10 tablets)',
      packSize: '10 tablets per strip',
      source: 'NPPA Pharma Sahi Daam'
    },
    category: '2nd Generation H1 Antihistamine',
    indication: 'Allergic rhinitis, persistent sneezing, runny nose, allergic conjunctivitis, itching hives (urticaria), insect bite reactions.',
    description: [
      'Potent, selective second-generation peripheral H1-receptor antagonist.',
      'Inhibits the early histamine-mediated phase of the allergic reaction and reduces migration of inflammatory cells.'
    ],
    instructions: 'Take 1 tablet once daily in the evening or at bedtime with water, with or without food.',
    standardDosage: '10 mg once daily (0-0-1) in the evening.',
    boxedWarning: null,
    precautions: [
      'May cause mild drowsiness in sensitive individuals; avoid driving or operating machinery.',
      'Avoid simultaneous intake of alcohol or CNS depressants.'
    ],
    doNotUse: ['Severe end-stage renal impairment (CrCl < 10 ml/min)', 'Cetirizine or hydroxyzine allergy'],
    interactions: ['Alcohol, sedatives, tranquilizers: additive central nervous system depression.'],
    sideEffects: ['Mild drowsiness', 'Dry mouth', 'Headache', 'Fatigue'],
    pharmacokinetics: 'Rapidly absorbed with peak plasma levels within 1 hour. Excreted mostly unchanged via renal filtration.',
    seekHelp: 'Seek medical care if acute angioedema or difficulty breathing occurs.',
    safety: {
      alcohol: 'UNSAFE',
      alcoholNote: 'Enhances somnolence and impairs cognitive coordination.',
      pregnancy: 'SAFE',
      pregnancyNote: 'FDA Category B equivalent; first-line antihistamine in pregnancy.',
      lactationNote: 'Excreted in human milk; use with doctor consultation.'
    },
    sources: ['CDSCO NLEM', 'NPPA Pharma Sahi Daam', 'RxNorm Concept (20610)', 'openFDA'],
    aliases: [
      'cetirizine 10 mg', 'cetirizine 10mg', 'cetirizine 10', 'cetirizine',
      'citirizine 10 mg', 'citirizine 10mg', 'citirizine', 'cetrizine 10', 'cetrizine',
      'okacet 10', 'okacet', 'cetzine 10', 'cetzine', 'alerid 10', 'alerid', 'zyrtec 10', 'zyrtec'
    ]
  },
  {
    id: 'allegra-120',
    brandName: 'Allegra 120',
    genericName: 'Fexofenadine Hydrochloride 120 mg',
    activeIngredients: [
      { name: 'Fexofenadine', usName: 'fexofenadine', strength: '120 mg' }
    ],
    strength: '120 mg',
    dosageForm: 'Tablet',
    route: 'Oral',
    manufacturer: 'Sanofi India Ltd',
    market: 'India (CDSCO / NPPA)',
    schedule: 'Schedule H (Prescription Required)',
    cdscoStatus: 'CDSCO Approved · Non-sedating Antihistamine',
    nppaPricing: {
      ceilingPrice: '₹18.50 / tablet',
      mrp: '₹185.00 (Strip of 10 tablets)',
      packSize: '10 tablets per strip',
      source: 'NPPA Pharma Sahi Daam'
    },
    category: 'Non-Sedating 2nd Generation Antihistamine',
    indication: 'Seasonal allergic rhinitis, hay fever, sneezing, watery itchy eyes, itchy throat, chronic idiopathic urticaria.',
    description: [
      'Truly non-sedating selective peripheral H1 blocker that does not cross the blood-brain barrier.',
      'Provides rapid 24-hour allergy relief without inducing drowsiness or daytime fatigue.'
    ],
    instructions: 'Take 1 tablet once daily with a full glass of water. Do NOT take with fruit juices (apple, orange, grapefruit) as they reduce drug absorption by up to 50%.',
    standardDosage: '120 mg once daily (1-0-0) with water.',
    boxedWarning: null,
    precautions: [
      'Separate from aluminum or magnesium antacids by at least 2 hours.',
      'Avoid taking with citrus juices.'
    ],
    doNotUse: ['Known fexofenadine hypersensitivity'],
    interactions: ['Fruit juices (OATP1A2 inhibition)', 'Antacids containing aluminum and magnesium'],
    sideEffects: ['Headache', 'Drowsiness (rare, <1%)', 'Mild nausea', 'Dizziness'],
    pharmacokinetics: 'Rapidly absorbed; peak at 2.6 hours. Excreted mainly unchanged in feces (80%) and urine (11%).',
    seekHelp: 'Consult doctor if hives persist beyond 6 weeks.',
    safety: {
      alcohol: 'CAUTION',
      alcoholNote: 'Minimal CNS interaction, but avoid excess alcohol.',
      pregnancy: 'CAUTION',
      pregnancyNote: 'FDA Category C; use when clearly necessary under doctor advice.',
      lactationNote: 'Consult doctor before nursing.'
    },
    sources: ['CDSCO', 'NPPA Pharma Sahi Daam', 'RxNorm Concept (217013)', 'openFDA'],
    aliases: [
      'allegra 120', 'allegra 120mg', 'allegra', 'allegra 180',
      'fexofenadine 120 mg', 'fexofenadine 120mg', 'fexofenadine', 'fexova', 'histafree'
    ]
  },
  {
    id: 'montair-lc',
    brandName: 'Montair-LC',
    genericName: 'Montelukast Sodium 10 mg + Levocetirizine HCl 5 mg',
    activeIngredients: [
      { name: 'Montelukast', usName: 'montelukast', strength: '10 mg' },
      { name: 'Levocetirizine', usName: 'levocetirizine', strength: '5 mg' }
    ],
    strength: '10 mg + 5 mg',
    dosageForm: 'Tablet',
    route: 'Oral',
    manufacturer: 'Cipla Ltd',
    market: 'India (CDSCO / NPPA)',
    schedule: 'Schedule H (Prescription Required)',
    cdscoStatus: 'CDSCO Approved FDC',
    nppaPricing: {
      ceilingPrice: '₹17.80 / tablet',
      mrp: '₹178.00 (Strip of 10 tablets)',
      packSize: '10 tablets per strip',
      source: 'NPPA Pharma Sahi Daam'
    },
    category: 'Dual Anti-allergic & Leukotriene Receptor Antagonist',
    indication: 'Persistent allergic rhinitis, nocturnal allergic cough, asthma-associated allergic rhinitis, seasonal pollinosis, nasal congestion.',
    description: [
      'Dual pathway blockade: Levocetirizine blocks histamine receptors while Montelukast selectively antagonizes cysteinyl leukotriene (CysLT1) receptors in respiratory airways.',
      'Controls both mucosal congestion, airway swelling, and acute allergic drainage.'
    ],
    instructions: 'Take 1 tablet once daily in the evening or at night before bedtime with water, with or without meals.',
    standardDosage: '1 tablet once daily at night (0-0-1).',
    boxedWarning: 'Neuropsychiatric Advisory: Montelukast carries an advisory regarding possible neuropsychiatric events (mood changes, vivid dreams, anxiety). Discontinue and report to doctor if behavioral changes arise.',
    precautions: [
      'Not for acute bronchospasm / acute asthma attack (requires rescue bronchodilator).',
      'May cause mild drowsiness; take at bedtime.'
    ],
    doNotUse: ['Severe renal impairment (CrCl < 10 ml/min)', 'Hypersensitivity to levocetirizine or montelukast'],
    interactions: ['Phenobarbital, Rifampicin (accelerate montelukast clearance).', 'Alcohol.'],
    sideEffects: ['Drowsiness', 'Dry mouth', 'Headache', 'Fatigue', 'Vivid dreams'],
    pharmacokinetics: 'Both drugs well absorbed with complementary half-lives ensuring complete 24-hour protection.',
    seekHelp: 'Discontinue immediately if severe agitation, depressive thoughts, or hallucinations occur.',
    safety: {
      alcohol: 'UNSAFE',
      alcoholNote: 'Compounds sedation and impaired vigilance.',
      pregnancy: 'CAUTION',
      pregnancyNote: 'Use only if clearly needed under medical supervision.',
      lactationNote: 'Levocetirizine passes into breast milk; consult physician.'
    },
    sources: ['CDSCO Approved FDC', 'NPPA Pharma Sahi Daam', 'RxNorm Concept', 'openFDA'],
    aliases: [
      'montair-lc', 'montair lc', 'montairlc', 'montair',
      'montek-lc', 'montek lc', 'telekast-l', 'romilast-l',
      'montelukast levocetirizine', 'montelukast 10 mg', 'levocetirizine 5 mg'
    ]
  },
  {
    id: 'ascoril-ls',
    brandName: 'Ascoril-LS Syrup',
    genericName: 'Levosalbutamol 1 mg + Ambroxol HCl 30 mg + Guaiphenesin 50 mg / 5ml',
    activeIngredients: [
      { name: 'Levosalbutamol', usName: 'levalbuterol', strength: '1 mg/5ml' },
      { name: 'Ambroxol HCl', usName: 'ambroxol', strength: '30 mg/5ml' },
      { name: 'Guaiphenesin', usName: 'guaifenesin', strength: '50 mg/5ml' }
    ],
    strength: 'Triple Expectorant Syrup',
    dosageForm: 'Syrup / Oral Liquid',
    route: 'Oral',
    manufacturer: 'Glenmark Pharmaceuticals Ltd',
    market: 'India (CDSCO / NPPA)',
    schedule: 'Schedule H (Prescription Required)',
    cdscoStatus: 'CDSCO Approved Triple FDC Syrup',
    nppaPricing: {
      ceilingPrice: '₹118.00 / 100ml bottle',
      mrp: '₹118.50 (100 ml Bottle)',
      packSize: '100 ml bottle',
      source: 'NPPA Pharma Sahi Daam'
    },
    category: 'Mucolytic Bronchodilator Cough Expectorant',
    indication: 'Productive wet cough, chest congestion, acute bronchitis, chronic obstructive bronchitis, asthma-associated phlegm clearance.',
    description: [
      'Triple-action formula: Levosalbutamol dilates constricted airways, Ambroxol dissolves thick viscous phlegm, and Guaiphenesin lubricates the airway to promote easy expectoration.',
      'Clears stubborn chest mucus without cardiac palpitations.'
    ],
    instructions: 'Take 10 ml three times daily using the provided measuring cup after food. Drink plenty of warm water throughout the day to aid mucus dissolution.',
    standardDosage: 'Adults: 10 ml three times daily (TDS). Children: as prescribed by pediatrician.',
    boxedWarning: null,
    precautions: [
      'Caution in patients with high blood pressure, arrhythmias, or hyperthyroidism.',
      'Keep well hydrated.'
    ],
    doNotUse: ['Severe cardiac arrhythmia', 'Known allergy to sympathomimetics'],
    interactions: ['Beta-blockers (Propranolol): antagonize bronchodilator action.', 'Diuretics.'],
    sideEffects: ['Fine finger tremors', 'Slight palpitations', 'Mild nausea', 'Dizziness'],
    pharmacokinetics: 'Rapid oral absorption with bronchodilation beginning within 15-30 minutes.',
    seekHelp: 'Seek medical care if severe chest pain, racing pulse, or shortness of breath worsens.',
    safety: {
      alcohol: 'CAUTION',
      alcoholNote: 'Avoid alcohol during respiratory illness.',
      pregnancy: 'CAUTION',
      pregnancyNote: 'Use under strict doctor monitoring.',
      lactationNote: 'Consult physician.'
    },
    sources: ['CDSCO Approved FDC', 'NPPA Pharma Sahi Daam', 'Indian Pharmacopoeia'],
    aliases: [
      'ascoril-ls syrup', 'ascoril-ls', 'ascoril ls', 'ascoril',
      'levosalbutamol ambroxol guaiphenesin', 'grilinctus-ls', 'bro-zedex'
    ]
  },
  {
    id: 'asthalin-inhaler',
    brandName: 'Asthalin Inhaler',
    genericName: 'Salbutamol (Albuterol) 100 mcg per actuation',
    activeIngredients: [
      { name: 'Salbutamol', usName: 'albuterol', strength: '100 mcg/puff' }
    ],
    strength: '100 mcg / actuation',
    dosageForm: 'Metered Dose Inhaler (MDI)',
    route: 'Inhalation',
    manufacturer: 'Cipla Ltd',
    market: 'India (CDSCO / NPPA)',
    schedule: 'Schedule H (Prescription Required)',
    cdscoStatus: 'CDSCO Approved · NLEM Essential Inhaler',
    nppaPricing: {
      ceilingPrice: '₹165.00 / inhaler',
      mrp: '₹165.00 (200 MDI Doses)',
      packSize: '200 actuations canister',
      source: 'NPPA Pharma Sahi Daam'
    },
    category: 'Short-Acting Beta-2 Agonist (SABA Bronchodilator)',
    indication: 'Acute bronchospasm, asthma attacks, exercise-induced asthma, COPD wheezing relief.',
    description: [
      'Rescue inhaler providing rapid bronchodilation within 5 minutes by stimulating beta-2 adrenergic receptors in bronchial smooth muscles.',
      'Gold standard fast-acting relief for acute shortness of breath and wheezing.'
    ],
    instructions: 'Shake inhaler well. Exhale completely, place mouthpiece in mouth, press canister while inhaling deeply and slowly. Hold breath for 10 seconds. Use spacer if needed.',
    standardDosage: '1 to 2 puffs as needed for acute wheezing (SOS). Maximum 8 puffs in 24 hours.',
    boxedWarning: 'Rescue Inhaler Warning: Relying solely on frequent rescue inhaler use (>2 times per week) indicates uncontrolled asthma and necessitates controller corticosteroid therapy.',
    precautions: ['Rinse mouth with water after use.', 'Caution in cardiovascular disease.'],
    doNotUse: ['Hypersensitivity to salbutamol'],
    interactions: ['Non-selective beta blockers (propranolol): block effect.'],
    sideEffects: ['Transient finger tremor', 'Mild tachycardia / palpitations', 'Nervousness'],
    pharmacokinetics: 'Immediate onset (within 5 min); duration of bronchodilation 4 to 6 hours.',
    seekHelp: 'Go to emergency immediately if severe breathlessness does not improve after 4 puffs.',
    safety: {
      alcohol: 'SAFE',
      alcoholNote: 'Minimal interaction, but avoid dehydrating excess alcohol.',
      pregnancy: 'SAFE',
      pregnancyNote: 'First-choice rescue bronchodilator in pregnancy.',
      lactationNote: 'Compatible with nursing mothers.'
    },
    sources: ['CDSCO NLEM', 'NPPA Pharma Sahi Daam', 'RxNorm Concept', 'openFDA'],
    aliases: [
      'asthalin inhaler', 'asthalin', 'salbutamol inhaler', 'albuterol inhaler',
      'asthalin 100', 'ventorlin', 'salbutamol 100 mcg'
    ]
  },

  // 5. Cardiovascular & Antihypertensives
  {
    id: 'telma-40',
    brandName: 'Telma 40',
    genericName: 'Telmisartan 40 mg',
    activeIngredients: [
      { name: 'Telmisartan', usName: 'telmisartan', strength: '40 mg' }
    ],
    strength: '40 mg',
    dosageForm: 'Tablet',
    route: 'Oral',
    manufacturer: 'Glenmark Pharmaceuticals Ltd',
    market: 'India (CDSCO / NPPA)',
    schedule: 'Schedule H (Prescription Required)',
    cdscoStatus: 'CDSCO Approved · NLEM Listed Antihypertensive',
    nppaPricing: {
      ceilingPrice: '₹7.20 / tablet',
      mrp: '₹108.00 (Strip of 15 tablets)',
      packSize: '15 tablets per strip',
      source: 'NPPA Pharma Sahi Daam'
    },
    category: 'Angiotensin II Receptor Blocker (ARB Antihypertensive)',
    indication: 'Essential hypertension (high blood pressure), cardiovascular risk reduction in patients with coronary artery disease or stroke history.',
    description: [
      'Selectively blocks the binding of Angiotensin II to the AT1 receptor, inducing vascular smooth muscle relaxation and lowering blood pressure.',
      'Possesses the longest terminal elimination half-life (~24 hours) among all ARBs, providing sustained 24-hour blood pressure control with a single morning dose.'
    ],
    instructions: 'Take 1 tablet once daily in the morning at the same time each day with water, with or without food. Do not stop abruptly.',
    standardDosage: '40 mg once daily (1-0-0). May be titrated to 80 mg daily if needed.',
    boxedWarning: 'Fetal Toxicity Warning: Strictly contraindicated throughout pregnancy. Drugs that act directly on the renin-angiotensin system can cause injury and death to the developing fetus.',
    precautions: [
      'Monitor blood pressure and serum potassium levels regularly.',
      'Avoid high-potassium salt substitutes unless approved by doctor.',
      'Stay adequately hydrated to prevent orthostatic hypotension.'
    ],
    doNotUse: ['Pregnancy (all trimesters)', 'Severe biliary obstructive disorders', 'Bilateral renal artery stenosis'],
    interactions: [
      'Potassium-sparing diuretics / potassium supplements: hyperkalemia risk.',
      'NSAIDs: may attenuate antihypertensive effect and worsen renal function.',
      'Lithium: increases serum lithium levels.'
    ],
    sideEffects: ['Dizziness upon standing (postural)', 'Back pain', 'Sinus congestion', 'Mild fatigue'],
    pharmacokinetics: 'Rapidly absorbed. Peak plasma levels within 0.5-1 hour. Highest lipophilicity and volume of distribution among ARBs. Elimination half-life ~24 hours.',
    seekHelp: 'Seek immediate care if severe dizziness, fainting, swelling of lips/face, or dangerously low blood pressure occurs.',
    safety: {
      alcohol: 'CAUTION',
      alcoholNote: 'Alcohol enhances hypotensive vasodilation, precipitating dizzy spells and fainting.',
      pregnancy: 'UNSAFE',
      pregnancyNote: 'STRICTLY CONTRAINDICATED: Causes serious renal failure and death in developing fetus.',
      lactationNote: 'Excreted in animal milk; not recommended during breastfeeding.'
    },
    sources: ['CDSCO NLEM', 'NPPA Pharma Sahi Daam', 'RxNorm Concept (313988)', 'openFDA'],
    aliases: [
      'telma 40', 'telma40', 'telma', 'telma 80', 'telma-40', 'telmikind 40',
      'telmisartan 40 mg', 'telmisartan 40mg', 'telmisartan', 'telsartan 40', 'micardis 40'
    ]
  },
  {
    id: 'atorva-10',
    brandName: 'Atorva 10',
    genericName: 'Atorvastatin Calcium 10 mg',
    activeIngredients: [
      { name: 'Atorvastatin', usName: 'atorvastatin', strength: '10 mg' }
    ],
    strength: '10 mg',
    dosageForm: 'Tablet',
    route: 'Oral',
    manufacturer: 'Zydus Lifesciences Ltd',
    market: 'India (CDSCO / NPPA)',
    schedule: 'Schedule H (Prescription Required)',
    cdscoStatus: 'CDSCO Approved · NLEM Listed Statin',
    nppaPricing: {
      ceilingPrice: '₹6.90 / tablet',
      mrp: '₹103.50 (Strip of 15 tablets)',
      packSize: '15 tablets per strip',
      source: 'NPPA Pharma Sahi Daam'
    },
    category: 'HMG-CoA Reductase Inhibitor (Statin / Lipid Lowering)',
    indication: 'Hypercholesterolemia, elevated LDL-C and triglycerides, primary prevention of cardiovascular events, post-myocardial infarction plaque stabilization.',
    description: [
      'Competitive inhibitor of HMG-CoA reductase, the rate-limiting enzyme in cholesterol biosynthesis.',
      'Upregulates hepatic LDL receptors, clearing atherogenic LDL and VLDL particles from circulation and stabilizing arterial plaques.'
    ],
    instructions: 'Take 1 tablet once daily in the evening or at night with water, with or without food. Maintain a heart-healthy diet.',
    standardDosage: '10 mg to 20 mg once daily (0-0-1) at bedtime.',
    boxedWarning: 'Muscle Toxicity: Statins can cause myopathy and rhabdomyolysis. Report unexplained muscle tenderness, weakness, or dark tea-colored urine immediately.',
    precautions: [
      'Check baseline liver function tests (ALT/AST) before starting.',
      'Avoid large quantities of grapefruit juice (>1 liter daily) as it inhibits CYP3A4 metabolism.'
    ],
    doNotUse: ['Active liver disease or unexplained persistent transaminase elevations', 'Pregnancy and nursing'],
    interactions: [
      'Clarithromycin, Itraconazole, Ketoconazole: strong CYP3A4 inhibitors increase statin blood levels and myopathy risk.',
      'Cyclosporine, Gemfibrozil.'
    ],
    sideEffects: ['Mild muscle aches', 'Joint pain', 'Dyspepsia', 'Slight elevation in blood glucose'],
    pharmacokinetics: 'Rapidly absorbed; peak plasma levels in 1-2 hours. Extensive first-pass hepatic metabolism. Half-life ~14 hours.',
    seekHelp: 'Contact physician immediately if unexplained muscle pain, dark brown urine, or extreme fatigue appears.',
    safety: {
      alcohol: 'CAUTION',
      alcoholNote: 'Chronic heavy alcohol use compounds liver enzyme elevations.',
      pregnancy: 'UNSAFE',
      pregnancyNote: 'STRICTLY CONTRAINDICATED in pregnancy: cholesterol is essential for fetal development.',
      lactationNote: 'Contraindicated during breastfeeding.'
    },
    sources: ['CDSCO NLEM', 'NPPA Pharma Sahi Daam', 'RxNorm Concept (83367)', 'openFDA'],
    aliases: [
      'atorva 10', 'atorva10', 'atorva', 'atorva 20', 'atorvastatin 10 mg', 'atorvastatin 10mg',
      'atorvastatin', 'lipitor 10', 'lipitor', 'storvas 10', 'atocor 10', 'tonact 10'
    ]
  },
  {
    id: 'ecosprin-75',
    brandName: 'Ecosprin 75',
    genericName: 'Aspirin 75 mg (Enteric-Coated)',
    activeIngredients: [
      { name: 'Aspirin', usName: 'aspirin', strength: '75 mg' }
    ],
    strength: '75 mg',
    dosageForm: 'Gastro-Resistant Tablet',
    route: 'Oral',
    manufacturer: 'USV Pvt Ltd',
    market: 'India (CDSCO / NPPA)',
    schedule: 'Schedule H / OTC Cardioprotective',
    cdscoStatus: 'CDSCO Approved · NLEM Essential Antiplatelet',
    nppaPricing: {
      ceilingPrice: '₹0.35 / tablet',
      mrp: '₹5.25 (Strip of 14 tablets)',
      packSize: '14 tablets per strip',
      source: 'NPPA Pharma Sahi Daam'
    },
    category: 'Antiplatelet / Cardioprotective Salicylate',
    indication: 'Secondary prevention of heart attacks, ischemic stroke prevention, transient ischemic attacks (TIA), coronary artery stent patency maintenance.',
    description: [
      'Low-dose gastro-resistant aspirin that irreversibly inhibits platelet cyclooxygenase-1 (COX-1), blocking thromboxane A2 production for the entire 7-10 day lifespan of the platelet.',
      'Prevents blood clot formation inside coronary and cerebral arteries.'
    ],
    instructions: 'Take 1 tablet daily after lunch or dinner with a glass of water. Swallow whole; do NOT crush the enteric coating.',
    standardDosage: '75 mg to 150 mg once daily (1-0-0 or 0-0-1).',
    boxedWarning: 'Bleeding Precaution: Increases bleeding time. Inform your surgeon or dentist of aspirin therapy prior to procedures.',
    precautions: ['Take after food to minimize GI erosion.', 'Avoid unmonitored use in active ulcer disease.'],
    doNotUse: ['Active gastrointestinal hemorrhage', 'Hemophilia / bleeding disorders', 'Aspirin-induced asthma'],
    interactions: ['Warfarin, Clopidogrel (increased bleeding risk)', 'NSAIDs like Ibuprofen (blunts cardioprotective effect).'],
    sideEffects: ['Mild heartburn', 'Easy bruising', 'Prolonged bleeding from minor cuts'],
    pharmacokinetics: 'Enteric coating resists gastric acid and dissolves in neutral pH of duodenum.',
    seekHelp: 'Seek immediate care if vomiting coffee-ground emesis or passing black stools.',
    safety: {
      alcohol: 'CAUTION',
      alcoholNote: 'Alcohol enhances gastrointestinal mucosal erosion.',
      pregnancy: 'CAUTION',
      pregnancyNote: 'Low-dose 75 mg is prescribed under obstetric supervision for pre-eclampsia prevention.',
      lactationNote: 'Low dose compatible under supervision.'
    },
    sources: ['CDSCO NLEM', 'NPPA Pharma Sahi Daam', 'RxNorm Concept', 'openFDA'],
    aliases: [
      'ecosprin 75', 'ecosprin75', 'ecosprin', 'ecosprin 150', 'aspirin 75 mg', 'aspirin 75mg',
      'low dose aspirin', 'enteric coated aspirin', 'delisprin 75'
    ]
  },

  // 6. Antidiabetic
  {
    id: 'glycomet-500',
    brandName: 'Glycomet 500',
    genericName: 'Metformin Hydrochloride 500 mg',
    activeIngredients: [
      { name: 'Metformin', usName: 'metformin', strength: '500 mg' }
    ],
    strength: '500 mg',
    dosageForm: 'Tablet',
    route: 'Oral',
    manufacturer: 'USV Pvt Ltd',
    market: 'India (CDSCO / NPPA)',
    schedule: 'Schedule H (Prescription Required)',
    cdscoStatus: 'CDSCO Approved · NLEM First-Line Antidiabetic',
    nppaPricing: {
      ceilingPrice: '₹1.80 / tablet',
      mrp: '₹27.00 (Strip of 15 tablets)',
      packSize: '15 tablets per strip',
      source: 'NPPA Pharma Sahi Daam'
    },
    category: 'Biguanide Oral Antidiabetic',
    indication: 'Type 2 Diabetes Mellitus, insulin resistance, pre-diabetes metabolic syndrome, Polycystic Ovary Syndrome (PCOS).',
    description: [
      'First-line cornerstone medication for Type 2 diabetes. Decreases hepatic gluconeogenesis, reduces intestinal glucose absorption, and enhances peripheral insulin sensitivity.',
      'Does not stimulate insulin secretion, virtually eliminating the risk of hypoglycemia when used as monotherapy.'
    ],
    instructions: 'Take with or immediately after meals with plenty of water. Starting with meals dramatically minimizes initial gastric discomfort.',
    standardDosage: '500 mg twice daily with meals (1-0-1), titrated up to 2000 mg daily as tolerated.',
    boxedWarning: 'Lactic Acidosis: Rare but serious metabolic complication. Risk increases in severe kidney failure, sepsis, hypoperfusion, acute heart failure, and excessive alcohol intake.',
    precautions: [
      'Monitor renal function (eGFR) periodically. Withhold if eGFR falls below 30 mL/min.',
      'Temporarily withhold prior to iodinated radiocontrast imaging procedures.',
      'Long-term therapy can decrease Vitamin B12 absorption; check levels annually.'
    ],
    doNotUse: ['Severe renal impairment (eGFR < 30 mL/min)', 'Acute metabolic acidosis / Diabetic ketoacidosis', 'Severe sepsis'],
    interactions: [
      'Alcohol (increased risk of lactic acidosis)',
      'Iodinated contrast agents (renal risk)',
      'Cimetidine (increases metformin levels)'
    ],
    sideEffects: ['Nausea', 'Abdominal bloating / gas', 'Loose stools initially', 'Metallic taste in mouth'],
    pharmacokinetics: 'Slowly absorbed from gastrointestinal tract with ~50-60% bioavailability. Not metabolized by liver; excreted unchanged in urine.',
    seekHelp: 'Go to emergency room if rapid shallow breathing, severe muscle cramping, unusual coldness, or extreme drowsiness occurs.',
    safety: {
      alcohol: 'UNSAFE',
      alcoholNote: 'Significantly potentiates the risk of life-threatening lactic acidosis.',
      pregnancy: 'SAFE',
      pregnancyNote: 'Widely used under specialist supervision for gestational diabetes and PCOS.',
      lactationNote: 'Excreted in low levels in breast milk; compatible under doctor guidance.'
    },
    sources: ['CDSCO NLEM', 'NPPA Pharma Sahi Daam', 'RxNorm Concept (6809)', 'openFDA'],
    aliases: [
      'glycomet 500', 'glycomet500', 'glycomet', 'glycomet-sr 500', 'glycomet 850', 'glycomet 1000',
      'metformin 500 mg', 'metformin 500mg', 'metformin500mg', 'metformin 500',
      'metformin', 'metforin', 'glucophage 500', 'obimet 500', 'cetapin 500'
    ]
  },
  {
    id: 'janumet-50-500',
    brandName: 'Janumet 50/500',
    genericName: 'Sitagliptin 50 mg + Metformin HCl 500 mg',
    activeIngredients: [
      { name: 'Sitagliptin', usName: 'sitagliptin', strength: '50 mg' },
      { name: 'Metformin', usName: 'metformin', strength: '500 mg' }
    ],
    strength: '50 mg + 500 mg',
    dosageForm: 'Film-Coated Tablet',
    route: 'Oral',
    manufacturer: 'MSD Pharmaceuticals Pvt Ltd / Sun Pharma',
    market: 'India (CDSCO / NPPA)',
    schedule: 'Schedule H (Prescription Required)',
    cdscoStatus: 'CDSCO Approved DPP-4 + Biguanide FDC',
    nppaPricing: {
      ceilingPrice: '₹24.00 / tablet',
      mrp: '₹360.00 (Strip of 15 tablets)',
      packSize: '15 tablets per strip',
      source: 'NPPA Pharma Sahi Daam'
    },
    category: 'DPP-4 Inhibitor with Biguanide Antidiabetic',
    indication: 'Type 2 Diabetes Mellitus inadequately controlled on metformin monotherapy.',
    description: [
      'Dual complementary mechanism: Sitagliptin prevents degradation of incretin hormones (GLP-1 and GIP) thereby increasing glucose-dependent insulin secretion, while Metformin suppresses hepatic glucose output.',
      'Achieves superior HbA1c reduction without weight gain or hypoglycemia.'
    ],
    instructions: 'Take 1 tablet twice daily with meals to reduce stomach upset.',
    standardDosage: '1 tablet twice daily (1-0-1) with food.',
    boxedWarning: 'Lactic Acidosis warning associated with Metformin component. Pancreatitis warning associated with Sitagliptin.',
    precautions: ['Discontinue if acute pancreatitis is suspected.', 'Monitor kidney function.'],
    doNotUse: ['eGFR < 30 mL/min', 'Diabetic ketoacidosis'],
    interactions: ['Alcohol', 'Digoxin: slight increase in digoxin levels.'],
    sideEffects: ['Mild diarrhea', 'Upper respiratory tract symptoms', 'Nausea', 'Headache'],
    pharmacokinetics: 'Both active drugs reach steady state within 2-3 days of oral dosing.',
    seekHelp: 'Discontinue and call emergency if severe abdominal pain radiating to the back occurs (pancreatitis sign).',
    safety: {
      alcohol: 'UNSAFE',
      alcoholNote: 'Lactic acidosis danger.',
      pregnancy: 'CAUTION',
      pregnancyNote: 'Insulin preferred during pregnancy.',
      lactationNote: 'Consult doctor.'
    },
    sources: ['CDSCO Approved FDC', 'NPPA Pharma Sahi Daam', 'RxNorm Concept', 'openFDA'],
    aliases: [
      'janumet 50/500', 'janumet', 'januvia', 'sitagliptin metformin',
      'istamet 50/500', 'zita-met'
    ]
  },

  // 7. Thyroid, Vitamins & Nutritional
  {
    id: 'thyronorm-50',
    brandName: 'Thyronorm 50 mcg',
    genericName: 'Levothyroxine Sodium 50 mcg',
    activeIngredients: [
      { name: 'Levothyroxine', usName: 'levothyroxine', strength: '50 mcg' }
    ],
    strength: '50 mcg (0.05 mg)',
    dosageForm: 'Tablet',
    route: 'Oral',
    manufacturer: 'Abbott India Ltd',
    market: 'India (CDSCO / NPPA)',
    schedule: 'Schedule H (Prescription Required)',
    cdscoStatus: 'CDSCO Approved · NLEM Listed Hormone',
    nppaPricing: {
      ceilingPrice: '₹1.20 / tablet',
      mrp: '₹144.00 (Bottle of 120 tablets)',
      packSize: '120 tablets per bottle',
      source: 'NPPA Pharma Sahi Daam'
    },
    category: 'Synthetic Thyroid Hormone Replacement',
    indication: 'Primary, secondary, and tertiary hypothyroidism; Hashimoto\'s thyroiditis; goiter suppression.',
    description: [
      'Synthetic crystalline L-thyroxine (T4) that replicates endogenous human thyroxine hormone.',
      'Deiodinated in peripheral tissues to active triiodothyronine (T3), regulating cellular metabolism, growth, and energy balance.'
    ],
    instructions: 'Must be taken first thing in the morning on an empty stomach with a full glass of plain water, at least 45 to 60 minutes before tea, coffee, breakfast, or other medications.',
    standardDosage: '50 mcg once daily early morning (1-0-0) on empty stomach. Dose adjusted based on TSH lab tests.',
    boxedWarning: 'Not for Obesity: Thyroid hormones, either alone or with other therapeutic agents, must never be used for the treatment of obesity or weight loss due to life-threatening cardiovascular toxicity.',
    precautions: [
      'Do not take with calcium supplements, iron pills, antacids, or soy products (leave at least a 4-hour gap).',
      'Requires regular serum TSH blood monitoring every 6-8 weeks until stable.'
    ],
    doNotUse: ['Uncorrected adrenal insufficiency', 'Untreated thyrotoxicosis', 'Acute myocardial infarction'],
    interactions: [
      'Calcium carbonate, Iron, Sucralfate: severely inhibit thyroxine absorption.',
      'Warfarin: increases anticoagulant effect.',
      'Antidiabetic drugs: thyroid therapy may increase diabetic requirement.'
    ],
    sideEffects: ['Palpitations or rapid pulse (if dose too high)', 'Heat intolerance', 'Tremors', 'Insomnia'],
    pharmacokinetics: 'Absorption occurs in jejunum and ileum (40-80% bioavailability). Elimination half-life is 6 to 7 days.',
    seekHelp: 'Contact physician if chest pain, rapid heartbeat, or extreme heat intolerance develops.',
    safety: {
      alcohol: 'SAFE',
      alcoholNote: 'Minimal direct interaction; maintain consistent routine.',
      pregnancy: 'SAFE',
      pregnancyNote: 'ESSENTIAL in pregnancy: Thyroid dose must be carefully maintained to ensure normal fetal brain development.',
      lactationNote: 'Minimal excretion in milk; safe and necessary during lactation.'
    },
    sources: ['CDSCO NLEM', 'NPPA Pharma Sahi Daam', 'RxNorm Concept (10582)', 'openFDA'],
    aliases: [
      'thyronorm 50 mcg', 'thyronorm 50', 'thyronorm50', 'thyronorm',
      'thyronorm 25', 'thyronorm 75', 'thyronorm 100', 'thyronorm 12.5',
      'levothyroxine 50 mcg', 'levothyroxine', 'eltroxin 50', 'synthroid 50', 'thyrox 50'
    ]
  },
  {
    id: 'shelcal-500',
    brandName: 'Shelcal 500',
    genericName: 'Elemental Calcium 500 mg + Vitamin D3 (Cholecalciferol) 250 IU',
    activeIngredients: [
      { name: 'Calcium Carbonate', usName: 'calcium carbonate', strength: '500 mg elemental Ca' },
      { name: 'Vitamin D3', usName: 'cholecalciferol', strength: '250 IU' }
    ],
    strength: '500 mg Ca + 250 IU D3',
    dosageForm: 'Tablet',
    route: 'Oral',
    manufacturer: 'Torrent Pharmaceuticals Ltd',
    market: 'India (CDSCO / NPPA)',
    schedule: 'OTC (Non-Scheduled)',
    cdscoStatus: 'CDSCO Approved · Essential Bone Supplement',
    nppaPricing: {
      ceilingPrice: '₹8.60 / tablet',
      mrp: '₹129.00 (Strip of 15 tablets)',
      packSize: '15 tablets per strip',
      source: 'NPPA Pharma Sahi Daam'
    },
    category: 'Nutritional Bone Supplement',
    indication: 'Calcium and Vitamin D deficiency, osteoporosis management, fracture healing, pregnancy & lactation calcium support, post-menopausal bone loss.',
    description: [
      'Provides 500 mg of bioavailable elemental calcium derived from calcium carbonate combined with Vitamin D3 to facilitate active intestinal calcium absorption.',
      'Essential for maintaining bone mineral density and tooth enamel strength.'
    ],
    instructions: 'Take 1 tablet daily after lunch or dinner with plenty of water. Calcium carbonate is best absorbed in the presence of gastric acid after meals.',
    standardDosage: '1 tablet once or twice daily after meals.',
    boxedWarning: null,
    precautions: [
      'Do not take at the exact same time as thyroid pills (Thyronorm) or iron pills (gap of 4 hours required).',
      'Drink adequate water throughout the day to avoid kidney stone formation.'
    ],
    doNotUse: ['Hypercalcemia', 'Hypercalciuria', 'Severe calcium nephrolithiasis (kidney stones)'],
    interactions: ['Thyroid hormone (Levothyroxine)', 'Tetracyclines', 'Bisphosphonates'],
    sideEffects: ['Mild constipation', 'Abdominal bloating / gas'],
    pharmacokinetics: 'Calcium absorbed via active transport in duodenum/jejunum regulated by Vitamin D3.',
    seekHelp: 'Consult doctor if severe nausea or persistent constipation occurs.',
    safety: {
      alcohol: 'SAFE',
      alcoholNote: 'Excessive alcohol impedes bone mineralization.',
      pregnancy: 'SAFE',
      pregnancyNote: 'Commonly prescribed during 2nd and 3rd trimesters for fetal skeletal growth.',
      lactationNote: 'Essential during nursing to replenish maternal calcium stores.'
    },
    sources: ['CDSCO NLEM', 'NPPA Pharma Sahi Daam', 'RxNorm Concept', 'openFDA'],
    aliases: [
      'shelcal 500', 'shelcal500', 'shelcal', 'shelcal hd',
      'cipcal 500', 'gemcal', 'calcimax 500', 'calcium vitamin d3'
    ]
  },
  {
    id: 'becosules',
    brandName: 'Becosules',
    genericName: 'Vitamin B-Complex + Vitamin C (Ascorbic Acid)',
    activeIngredients: [
      { name: 'Vitamin B1 (Thiamine)', usName: 'thiamine', strength: '10 mg' },
      { name: 'Vitamin B2 (Riboflavin)', usName: 'riboflavin', strength: '10 mg' },
      { name: 'Vitamin B6 (Pyridoxine)', usName: 'pyridoxine', strength: '3 mg' },
      { name: 'Vitamin B12 (Cyanocobalamin)', usName: 'cyanocobalamin', strength: '15 mcg' },
      { name: 'Niacinamide (B3)', usName: 'niacinamide', strength: '100 mg' },
      { name: 'Folic Acid (B9)', usName: 'folic acid', strength: '1.5 mg' },
      { name: 'Vitamin C', usName: 'ascorbic acid', strength: '150 mg' }
    ],
    strength: 'B-Complex High Potency',
    dosageForm: 'Capsule',
    route: 'Oral',
    manufacturer: 'Pfizer Ltd',
    market: 'India (CDSCO / NPPA)',
    schedule: 'OTC (Non-Scheduled)',
    cdscoStatus: 'CDSCO Approved · NLEM Vitamin Formulation',
    nppaPricing: {
      ceilingPrice: '₹2.80 / capsule',
      mrp: '₹56.00 (Strip of 20 capsules)',
      packSize: '20 capsules per strip',
      source: 'NPPA Pharma Sahi Daam'
    },
    category: 'Therapeutic Multivitamin & Tissue Repair',
    indication: 'Aphthous mouth ulcers (stomatitis), angular cheilitis, post-antibiotic vitamin depletion, chronic fatigue, nutritional neuropathy.',
    description: [
      'Comprehensive high-potency water-soluble B-complex vitamins coupled with Vitamin C.',
      'Acts as essential cofactors in energy metabolism, cellular respiration, myelin nerve sheath maintenance, and mucosal epithelial healing.'
    ],
    instructions: 'Take 1 capsule once daily after breakfast or lunch with a glass of water.',
    standardDosage: '1 capsule daily in the morning (1-0-0).',
    boxedWarning: null,
    precautions: [
      'Harmless bright yellow coloration of urine will occur due to excretion of excess riboflavin (Vitamin B2); this is completely normal.'
    ],
    doNotUse: ['Known hypersensitivity to any formulation component'],
    interactions: ['Levodopa (B6 reduces levodopa efficacy if taken without carbidopa).'],
    sideEffects: ['Harmless bright fluorescent yellow urine', 'Mild flushing sensation'],
    pharmacokinetics: 'Rapidly absorbed in the proximal small intestine. Excess water-soluble vitamins excreted freely via kidneys.',
    seekHelp: 'Consult doctor if severe mouth sores persist beyond 2 weeks.',
    safety: {
      alcohol: 'SAFE',
      alcoholNote: 'Alcoholics frequently suffer from acute B-vitamin deficiency and benefit from supplementation.',
      pregnancy: 'SAFE',
      pregnancyNote: 'Safe and beneficial throughout pregnancy.',
      lactationNote: 'Excreted in human milk; safe during lactation.'
    },
    sources: ['CDSCO NLEM', 'NPPA Pharma Sahi Daam', 'RxNorm Concept', 'openFDA'],
    aliases: [
      'becosules', 'becosule', 'becosules capsule', 'cobadex',
      'vitamin b complex', 'b complex', 'neurobion', 'zincovit', 'supradyn'
    ]
  },
  {
    id: 'limcee-500',
    brandName: 'Limcee 500',
    genericName: 'Ascorbic Acid (Vitamin C) 500 mg',
    activeIngredients: [
      { name: 'Vitamin C', usName: 'ascorbic acid', strength: '500 mg' }
    ],
    strength: '500 mg',
    dosageForm: 'Chewable Tablet',
    route: 'Oral (Chewable)',
    manufacturer: 'Abbott Healthcare Pvt Ltd',
    market: 'India (CDSCO / NPPA)',
    schedule: 'OTC (Non-Scheduled)',
    cdscoStatus: 'CDSCO Approved · NLEM Listed',
    nppaPricing: {
      ceilingPrice: '₹1.50 / tablet',
      mrp: '₹22.50 (Strip of 15 tablets)',
      packSize: '15 tablets per strip',
      source: 'NPPA Pharma Sahi Daam'
    },
    category: 'Antioxidant & Immune Supplement',
    indication: 'Immunity booster, wound healing, collagen synthesis, iron absorption enhancement, prevention and treatment of scurvy.',
    description: [
      'Chewable orange-flavored ascorbic acid tablet delivering potent antioxidant defense.',
      'Essential for collagen formation, tissue repair, and immune cellular defense.'
    ],
    instructions: 'Chew 1 tablet thoroughly after meals once or twice daily. Do not swallow whole.',
    standardDosage: '500 mg once or twice daily.',
    boxedWarning: null,
    precautions: ['Avoid extremely high megadoses (>2000 mg/day) in patients with history of oxalate kidney stones.'],
    doNotUse: ['Known oxalate nephrolithiasis history'],
    interactions: ['Enhances iron absorption from intestines (therapeutic benefit).'],
    sideEffects: ['Mild stomach acid sensation if chewed on empty stomach'],
    pharmacokinetics: 'Readily absorbed from intestine; body pool saturated around 1500 mg.',
    seekHelp: 'Rarely causes serious adverse events.',
    safety: {
      alcohol: 'SAFE',
      alcoholNote: 'Replenishes antioxidant status.',
      pregnancy: 'SAFE',
      pregnancyNote: 'Safe and recommended in pregnancy.',
      lactationNote: 'Naturally present in breast milk.'
    },
    sources: ['CDSCO', 'NPPA Pharma Sahi Daam', 'RxNorm Concept', 'openFDA'],
    aliases: ['limcee 500', 'limcee', 'vitamin c 500', 'vitamin c', 'celin 500', 'sukcee 500']
  },

  // 8. Anti-emetics & CNS
  {
    id: 'ondem-4',
    brandName: 'Ondem 4',
    genericName: 'Ondansetron Hydrochloride 4 mg',
    activeIngredients: [
      { name: 'Ondansetron', usName: 'ondansetron', strength: '4 mg' }
    ],
    strength: '4 mg',
    dosageForm: 'Mouth Dissolving Tablet (MD)',
    route: 'Oral',
    manufacturer: 'Alkem Laboratories Ltd',
    market: 'India (CDSCO / NPPA)',
    schedule: 'Schedule H (Prescription Required)',
    cdscoStatus: 'CDSCO Approved · NLEM Anti-emetic',
    nppaPricing: {
      ceilingPrice: '₹5.40 / tablet',
      mrp: '₹54.00 (Strip of 10 tablets)',
      packSize: '10 tablets per strip',
      source: 'NPPA Pharma Sahi Daam'
    },
    category: '5-HT3 Serotonin Receptor Antagonist',
    indication: 'Nausea, acute vomiting, viral gastroenteritis, food poisoning-induced emesis, post-operative vomiting, chemotherapy/radiotherapy nausea.',
    description: [
      'Potent, highly selective 5-HT3 receptor antagonist.',
      'Inhibits serotonin triggers both on vagal afferents in the gut and centrally in the chemoreceptor trigger zone (CTZ).'
    ],
    instructions: 'Place tablet on the tongue and allow it to dissolve completely without chewing, then swallow with saliva or a small sip of water. Take 30 minutes before travel or meals.',
    standardDosage: '4 mg to 8 mg every 8 hours as needed (SOS / 1-0-1).',
    boxedWarning: 'QT Prolongation: May cause dose-dependent prolongation of QT interval. Caution in congenital long QT syndrome.',
    precautions: ['Caution in patients with hypokalemia or hypomagnesemia.'],
    doNotUse: ['Concomitant apomorphine use', 'Known ondansetron allergy'],
    interactions: ['Apomorphine (severe hypotension and loss of consciousness)', 'Tramadol (may reduce tramadol analgesia).'],
    sideEffects: ['Mild headache', 'Constipation', 'Flushing sensation / warmth'],
    pharmacokinetics: 'Well absorbed from GI tract; peak plasma levels in ~1.5 hours.',
    seekHelp: 'Seek medical care if severe palpitations or chest tightness develops.',
    safety: {
      alcohol: 'CAUTION',
      alcoholNote: 'Avoid alcohol during acute gastroenteritis.',
      pregnancy: 'CAUTION',
      pregnancyNote: 'Commonly prescribed for hyperemesis gravidarum under medical specialist supervision.',
      lactationNote: 'Excreted in animal milk; use with clinical supervision.'
    },
    sources: ['CDSCO NLEM', 'NPPA Pharma Sahi Daam', 'RxNorm Concept (261551)', 'openFDA'],
    aliases: [
      'ondem 4', 'ondem', 'ondem md 4', 'ondem md', 'emeset 4', 'emeset',
      'ondansetron 4 mg', 'ondansetron 4mg', 'ondansetron', 'zofran', 'vomikind 4'
    ]
  }
];

// Common Spelling Typo Dictionary
export const COMMON_TYPO_MAP = {
  // Brand Typos
  dollo: 'dolo',
  dolo650: 'dolo 650',
  dollo650: 'dolo 650',
  augmentin625: 'augmentin 625',
  clavam625: 'clavam 625',
  pand: 'pan-d',
  'pan d': 'pan-d',
  pantocid40: 'pantocid 40',
  pantop40: 'pantop 40',
  montairlc: 'montair-lc',
  'montair lc': 'montair-lc',
  zerodolsp: 'zerodol-sp',
  'zerodol sp': 'zerodol-sp',
  meftalspas: 'meftal-spas',
  'meftal spas': 'meftal-spas',
  norfloxtz: 'norflox-tz',
  'norflox tz': 'norflox-tz',
  glycomet500: 'glycomet 500',
  telma40: 'telma 40',
  atorva10: 'atorva 10',
  shelcal500: 'shelcal 500',
  limcee500: 'limcee 500',
  ondem4: 'ondem 4',

  // Generic and Ingredient Typos
  paracetmol: 'paracetamol',
  paracitamol: 'paracetamol',
  paracetamole: 'paracetamol',
  acetominophen: 'acetaminophen',
  acetaminofen: 'acetaminophen',
  pantoprazol: 'pantoprazole',
  pantaprazole: 'pantoprazole',
  pantoprazole40mg: 'pantoprazole 40 mg',
  metformin500mg: 'metformin 500 mg',
  metforin: 'metformin',
  metaformin: 'metformin',
  metformn: 'metformin',
  citirizine: 'cetirizine',
  citerizine: 'cetirizine',
  cetrizine: 'cetirizine',
  cetirizine10mg: 'cetirizine 10 mg',
  amoxacillin: 'amoxicillin',
  amoxycillin: 'amoxicillin',
  amoxycilin: 'amoxicillin',
  azithromicin: 'azithromycin',
  azithromycine: 'azithromycin',
  azithro: 'azithromycin',
  ibuprofin: 'ibuprofen',
  ibrupofen: 'ibuprofen',
  combiflm: 'combiflam',
  levocitirizine: 'levocetirizine',
  montelukast: 'montelukast',
  telmisertan: 'telmisartan',
  telmisartin: 'telmisartan',
  atorvastin: 'atorvastatin',
  rosuvastin: 'rosuvastatin',
  omeprazol: 'omeprazole',
  ranitadine: 'ranitidine',
  levothyroxin: 'levothyroxine',
  ondansetron: 'ondansetron'
};

// Ingredient Synonyms
export const INGREDIENT_SYNONYMS = {
  paracetamol: 'acetaminophen',
  acetaminophen: 'acetaminophen',
  pcm: 'acetaminophen',
  'clavulanic acid': 'clavulanate',
  clavulanate: 'clavulanate',
  salbutamol: 'albuterol',
  albuterol: 'albuterol',
  aspirin: 'aspirin',
  'acetylsalicylic acid': 'aspirin',
  'vitamin c': 'ascorbic acid',
  'ascorbic acid': 'ascorbic acid',
  'vitamin d3': 'cholecalciferol',
  cholecalciferol: 'cholecalciferol',
  levothyroxine: 'levothyroxine',
  'l-thyroxine': 'levothyroxine'
};
