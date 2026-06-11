// Shared Medical Symptom & Disease Database for MedWeb

export const symptomDb = [
  {
    keys: ["appendix", "appendicitis", "right lower stomach", "rupture appendix", "appendicular", "appendix pain", "belly button pain"],
    disease: "Appendicitis (Acute Abdomen)",
    explanation: "Appendicitis is an acute inflammation of the appendix. It is a critical medical emergency that requires prompt surgical removal (appendectomy) before the organ ruptures.",
    selfCare: [
      "Rest quietly in a comfortable position.",
      "Do not apply heat pads to your stomach (can accelerate rupture risk).",
      "Do not take laxatives, enemas, or pain relievers as they can mask warning signs or cause rupture.",
      "Go to the emergency room immediately."
    ],
    whatToEat: [
      "Do not eat or drink anything (remain completely NPO - Nil Per Os) to prepare your stomach for potential emergency surgery and anesthesia."
    ],
    whatToAvoid: [
      "Do not consume water, food, or sodas.",
      "Do not take pain relief pills or antacids.",
      "Do not perform strenuous movements."
    ],
    seekHelp: "🚨 EMERGENCY. Go to the nearest emergency room immediately. A ruptured appendix can cause life-threatening abdominal infections (peritonitis)."
  },
  {
    keys: ["chest", "heart", "breath", "lungs", "stroke", "numb", "cardiac", "dizzy", "unconscious", "collapse", "chest pain", "chest tightness", "chest pressure", "shortness of breath", "breathing difficulty"],
    disease: "Chest Distress / Shortness of Breath (Emergency Risk)",
    explanation: "Severe chest pain, tightness, or extreme breathing difficulties can indicate life-threatening cardiac or pulmonary emergencies like a heart attack, blood clot, or severe asthma attack.",
    selfCare: [
      "🛑 STOP all physical activity immediately and sit in an upright, comfortable position.",
      "Loosen all tight clothing, collars, ties, and belts to assist breathing.",
      "Call your local emergency services (108 / 911) immediately.",
      "Do not try to drive yourself to the emergency room."
    ],
    whatToEat: [
      "Do not consume any food, liquids, or oral medications during an emergency unless specifically instructed by a medical dispatcher or emergency responder."
    ],
    whatToAvoid: [
      "Do not eat, drink, or smoke.",
      "Do not engage in physical exertion.",
      "Do not ignore the pain or wait to see if it passes."
    ],
    seekHelp: "🚨 CALL EMERGENCY SERVICES IMMEDIATELY. This is a critical situation. Do not delay under any circumstances."
  },
  {
    keys: ["diabetes", "diabetic", "sugar", "insulin", "high blood sugar", "hyperglycemia", "diabetic ketoacidosis", "frequent urination", "excessive thirst"],
    disease: "Diabetes Mellitus (High Blood Sugar)",
    explanation: "Diabetes is a chronic metabolic disorder where the body either cannot produce enough insulin or cannot effectively use it, leading to elevated glucose levels in the blood stream.",
    selfCare: [
      "Check your blood glucose levels immediately using a glucometer.",
      "Take your prescribed insulin or diabetes medication exactly as directed by your doctor.",
      "Drink plenty of water to help flush excess glucose out of your bloodstream through urine.",
      "Inspect your feet daily for any minor cuts, sores, or blisters."
    ],
    whatToEat: [
      "Fiber-rich whole grains (steel-cut oats, quinoa, brown rice).",
      "Leafy green vegetables (spinach, kale) and non-starchy vegetables (broccoli, cauliflower).",
      "Lean proteins (skinless chicken, baked fish, tofu, beans).",
      "Healthy fats in small portions (almonds, walnuts, avocados).",
      "Cinnamon water or herbal green tea (supports glycemic health)."
    ],
    whatToAvoid: [
      "Refined sugars, syrups, candies, and sweetened beverages/sodas.",
      "White flour products (white bread, regular pasta, pastries).",
      "High-glycemic processed foods and snacks (potato chips, crackers).",
      "Excessive fruit juice (lacks fiber and spikes blood sugar rapidly).",
      "Alcohol and trans-fats."
    ],
    seekHelp: "Seek emergency care if blood sugar exceeds 240 mg/dL accompanied by ketones, severe confusion, persistent vomiting, extreme thirst, rapid breathing, or a fruity odor to your breath (signs of Diabetic Ketoacidosis)."
  },
  {
    keys: ["hypertension", "blood pressure", "high bp", "bp high", "hypertensive"],
    disease: "Hypertension (High Blood Pressure)",
    explanation: "Hypertension is a condition where the blood pressure exerted against your arterial walls is consistently too high, forcing the heart to work harder and increasing cardiovascular risks.",
    selfCare: [
      "Sit down and rest quietly in a calm, dark environment.",
      "Practice slow, deep breathing (inhale for 4 seconds, hold for 4, exhale for 6).",
      "Take your prescribed blood pressure medication if you have missed a dose.",
      "Avoid stressful conversations, work, or physical exertion."
    ],
    whatToEat: [
      "Potassium-rich foods (bananas, sweet potatoes, spinach) to help flush out sodium.",
      "Berries (blueberries, strawberries) which contain natural anti-inflammatory flavonoids.",
      "Garlic (raw or cooked) and beetroot juice (supports nitric oxide vessel dilation).",
      "Oatmeal, unsalted almonds, and flaxseeds.",
      "Low-fat or skim milk."
    ],
    whatToAvoid: [
      "High-sodium meals, pickles, table salt, and canned soups.",
      "Processed meats (bacon, sausages, deli meats) and soy sauce.",
      "Caffeine (coffee, energy drinks) and alcohol.",
      "Saturated fats, fried foods, and tobacco/smoking."
    ],
    seekHelp: "Seek urgent emergency care if your blood pressure reading is 180/120 mmHg or higher, or if it is accompanied by chest pain, a severe headache, blurred vision, shortness of breath, or numbness/weakness."
  },
  {
    keys: ["asthma", "wheezing", "breathless", "inhaler", "bronchospasm", "wheeze", "asthmatic"],
    disease: "Bronchial Asthma / Wheezing",
    explanation: "Asthma is a chronic inflammation of the airways that causes them to swell, narrow, and produce excess mucus, triggering chest tightness, coughing, and whistling wheezes during exhalation.",
    selfCare: [
      "Sit upright immediately; do not lie down as it constricts breathing.",
      "Take 2-4 puffs of your quick-relief rescue inhaler (Albuterol/Salbutamol) immediately.",
      "Stay calm; anxiety can tighten chest muscles and worsen airway constriction.",
      "Move away from trigger sources (dust, smoke, cold air, pet dander)."
    ],
    whatToEat: [
      "Warm liquids like herbal teas (ginger, chamomile) to relax bronchia.",
      "Foods high in Vitamin D (fortified milks, egg yolks) to support lung immunity.",
      "Magnesium-rich foods (spinach, pumpkin seeds, dark chocolate) which support muscle relaxation.",
      "Anti-inflammatory omega-3 foods (walnuts, flaxseeds)."
    ],
    whatToAvoid: [
      "Foods containing sulfites (dried fruits, processed potatoes, pickled foods, wine).",
      "Very cold drinks or ice creams that can trigger reflex airway spasms.",
      "Heavy meals that bloat the stomach and press upward against the diaphragm."
    ],
    seekHelp: "Seek emergency medical help if your rescue inhaler does not ease breathing within 15 minutes, you struggle to speak in full sentences, your chest and ribs pull inward deeply when breathing, or your lips turn blue."
  },
  {
    keys: ["malaria", "dengue", "typhoid", "mosquito", "viral fever", "chikungunya", "papaya leaf", "high fever joint pain"],
    disease: "Tropical Infections (Dengue, Malaria, Typhoid)",
    explanation: "Tropical febrile illnesses are caused by mosquito-borne parasites/viruses (Malaria, Dengue) or bacterial contamination in food/water (Typhoid), causing persistent high fevers.",
    selfCare: [
      "Maintain strict bed rest in a well-ventilated, mosquito-netted room.",
      "Apply cool, damp compresses to your forehead and underarms to ease high fever.",
      "Stay hydrated at all costs to prevent severe fluid loss.",
      "Monitor temperature and check platelet count (especially for Dengue) as advised by a doctor."
    ],
    whatToEat: [
      "Fresh coconut water and Oral Rehydration Salts (ORS) to maintain mineral balance.",
      "Papaya leaf extract juice (shown to help boost platelet counts in Dengue).",
      "Light, semi-solid foods like plain rice porridge, khichdi, or soft oats.",
      "Boiled eggs or double-boiled chicken broth for protein support.",
      "Warm herbal decoctions of tulsi, ginger, or coriander seeds."
    ],
    whatToAvoid: [
      "DO NOT take pain relievers like Aspirin, Ibuprofen, or Naproxen (NSAIDs) as they can cause severe internal bleeding in Dengue. Use only Paracetamol.",
      "Spicy, oily, and heavy ghee-laden foods that strain the digestive tract.",
      "Raw vegetables and fruits that are not peeled/washed in boiled water (Typhoid risk)."
    ],
    seekHelp: "Seek immediate hospitalization if you experience bleeding from the nose, gums, or skin, persistent vomiting, severe abdominal pain, sudden extreme weakness, or confusion."
  },
  {
    keys: ["constipation", "hard stool", "straining", "bowel movement", "constipated", "irregular bowel"],
    disease: "Constipation",
    explanation: "Constipation occurs when bowel movements become infrequent or difficult, usually due to a lack of dietary fiber, inadequate hydration, or low physical activity.",
    selfCare: [
      "Drink a large glass of warm water first thing in the morning.",
      "Set a consistent daily time for bowel movements and do not rush.",
      "Engage in a 20-minute walk to stimulate intestinal muscle contractions.",
      "Try squatting or using a footstool to elevate your knees while on the toilet."
    ],
    whatToEat: [
      "High-fiber foods (prunes, figs, apples, pears, berries, beans, lentils).",
      "Whole grains (quinoa, oats, barley, whole-wheat bran).",
      "Flaxseeds and chia seeds soaked in water (natural bulking mucilage).",
      "Warm water, prune juice, and warm herbal teas.",
      "Probiotic foods like plain unsweetened yogurt or kefir."
    ],
    whatToAvoid: [
      "Processed junk foods, frozen meals, and fast food.",
      "Heavy dairy items (large amounts of cheese, butter, whole milk).",
      "Red meat, which is slow to digest and lacks fiber.",
      "Unripe green bananas (contain high starch levels that bind stools).",
      "Refined grains (white bread, white rice, pastries)."
    ],
    seekHelp: "Consult your doctor if constipation lasts more than 2 weeks, is accompanied by severe abdominal cramps, vomiting, fever, blood in stool, or unexplained weight loss."
  },
  {
    keys: ["arthritis", "joint pain", "knee pain", "joint stiffness", "gout", "rheumatoid", "osteoarthritis", "joint swelling"],
    disease: "Arthritis & Joint Inflammation",
    explanation: "Arthritis is an inflammatory or degenerative condition of the joints (like Osteoarthritis, Rheumatoid Arthritis, or Gout) causing cartilage breakdown, swelling, stiffness, and pain.",
    selfCare: [
      "Apply a warm compress or take a warm shower to relieve morning stiffness.",
      "Use an ice pack wrap on swollen, warm joints to numb acute inflammatory pain.",
      "Perform gentle low-impact joint movements (swimming, cycling, walking).",
      "Maintain a healthy weight to reduce load stress on knees, hips, and ankles."
    ],
    whatToEat: [
      "Omega-3 fatty acid foods (salmon, sardines, walnuts, flaxseeds) to fight inflammation.",
      "Extra virgin olive oil (contains oleocanthal, which behaves like natural ibuprofen).",
      "Antioxidant fruits (tart cherries, strawberries, blueberries).",
      "Turmeric and ginger (powerful natural anti-inflammatory spices).",
      "Green tea (contains EGCG which limits joint destruction enzymes)."
    ],
    whatToAvoid: [
      "High-sugar foods, candies, sodas, and baked treats (trigger cytokines).",
      "Refined carbohydrates (white flour, white rice).",
      "Trans-fats, margarine, and processed corn oil.",
      "High-purine foods (for Gout patients, avoid red meat, shellfish, organ meats, and beer)."
    ],
    seekHelp: "See a clinician if joint pain is accompanied by high fever, rapid joint swelling with extreme redness, severe pain that prevents weight-bearing, or joint deformity."
  },
  {
    keys: ["fever", "temp", "cold", "cough", "flu", "throat", "bronchitis", "shiver", "congestion", "sneezing", "runny nose", "sore throat", "coughing", "sneeze"],
    disease: "Fever, Cold & Flu (Respiratory Infection)",
    explanation: "A temporary rise in body temperature, coughing, or throat irritation is typically the body's immune response fighting off viral or bacterial infections like the common cold or influenza.",
    selfCare: [
      "Get plenty of bed rest to conserve energy for fighting the infection.",
      "Stay hydrated by sipping warm water, herbal teas, or electrolyte solutions.",
      "Gargle with warm saline water (1/2 tsp salt in warm water) to relieve throat soreness.",
      "Use vapor inhalation or a humidifier to clear nasal congestion.",
      "Use a cool, damp washcloth on your forehead to naturally ease high temperatures."
    ],
    whatToEat: [
      "Warm chicken soup or vegetable broths (replenishes sodium and fluids).",
      "Vitamin C-rich foods (citrus fruits like oranges, strawberries, bell peppers).",
      "Ginger-honey tea to soothe throat inflammation and calm coughs.",
      "Bland, soft foods like oatmeal or boiled vegetables that are easy to digest.",
      "Garlic and onions, which contain natural antimicrobial compounds."
    ],
    whatToAvoid: [
      "Dairy products (milk, cheese) as they can thicken throat mucus.",
      "Sugary juices and sodas, which can inflame the body and weaken immunity.",
      "Caffeine and alcohol, which contribute to dehydration.",
      "Cold water, ice creams, and frozen foods that might trigger coughing fits.",
      "Deep-fried, heavy, or highly processed meals."
    ],
    seekHelp: "Seek immediate medical consultation if your fever exceeds 103°F (39.4°C), persists for more than 3 days, or is accompanied by difficulty breathing, a stiff neck, persistent vomiting, or severe chest pain."
  },
  {
    keys: ["headache", "migraine", "tension", "head ache", "temple pain", "head pain", "throbbing head"],
    disease: "Tension Headache or Migraine",
    explanation: "Headaches are commonly caused by muscle tension in the neck, fatigue, stress, dehydration, or vascular fluctuations (as seen in migraines, which are also triggered by bright lights or foods).",
    selfCare: [
      "Relax in a quiet, dark room away from screens and bright lights.",
      "Apply a cold washcloth or ice pack to your forehead or temples for migraines.",
      "Use a warm compress on your neck or shoulders if it is a tension headache.",
      "Gently massage your neck, shoulders, and temples to relieve muscle stiffness.",
      "Practice deep breathing or meditation to lower stress levels."
    ],
    whatToEat: [
      "Magnesium-rich foods (spinach, almonds, pumpkin seeds) to relax blood vessels.",
      "Hydrating foods (watermelon, cucumbers, celery) if triggered by dehydration.",
      "Herbal chamomile or peppermint tea to reduce nausea and tension.",
      "A small amount of caffeine (like black tea or coffee) can constrict dilated vessels.",
      "Bananas, which provide quick energy and magnesium."
    ],
    whatToAvoid: [
      "Aged cheeses and processed meats containing nitrates/nitrites.",
      "Artificial sweeteners (aspartame) and MSG (monosodium glutamate).",
      "Alcohol (especially red wine) and heavy caffeine consumption.",
      "Skipping meals or fasting (hypoglycemia triggers headaches).",
      "Excessive screen time and loud environments."
    ],
    seekHelp: "Seek emergency medical help immediately if you experience a sudden, explosive 'thunderclap' headache, or if it is accompanied by fever, a stiff neck, confusion, double vision, numbness, or difficulty speaking."
  },
  {
    keys: ["stomach", "belly", "nausea", "vomit", "diarrhea", "cramp", "poisoning", "gastroenteritis", "loose motion", "stomach pain", "stomach ache", "vomiting", "nauseous", "belly pain"],
    disease: "Stomach Distress, Food Poisoning & Gastroenteritis",
    explanation: "Inflammation of the stomach and intestines (commonly known as stomach flu or food poisoning) is caused by consuming contaminated food/water or viral/bacterial pathogens.",
    selfCare: [
      "Sip water or Oral Rehydration Salts (ORS) slowly. Avoid gulping large amounts.",
      "Let your stomach rest for a few hours after vomiting before eating.",
      "Apply a warm hot-water bottle to your abdomen to soothe muscle spasms.",
      "Rest extensively to allow your gastrointestinal tract to recover."
    ],
    whatToEat: [
      "The BRAT diet: Bananas, Rice (plain white), Applesauce, and Toast (dry).",
      "Clear vegetable or chicken broth (easy on the stomach and hydrating).",
      "Coconut water or diluted electrolytes (replenishes lost potassium and minerals).",
      "Saltine crackers to help absorb stomach acid.",
      "Plain oatmeal or boiled potatoes."
    ],
    whatToAvoid: [
      "Dairy products (milk, butter, cheese, yogurt) as lactose is hard to digest now.",
      "Spicy, greasy, and deep-fried foods that irritate the stomach lining.",
      "Caffeine, carbonated sodas, and alcohol.",
      "Sugary candies, fruits, or artificial sweeteners (which can worsen diarrhea).",
      "Very hot or very cold liquids."
    ],
    seekHelp: "Consult a doctor if you cannot retain liquids for more than 24 hours, notice blood in your vomit or stool, run a high fever, or show signs of severe dehydration (dry mouth, dark urine, extreme dizziness)."
  },
  {
    keys: ["acidity", "heartburn", "gerd", "acid reflux", "gas", "bloating", "acid burning"],
    disease: "Acid Reflux & Heartburn (Acidity)",
    explanation: "Acidity occurs when stomach acid flows back up into the esophagus (acid reflux), irritating the sensitive lining and causing a burning sensation behind the breastbone.",
    selfCare: [
      "Stand or sit upright after eating; do not lie down flat for at least 2-3 hours.",
      "Elevate the head of your bed by 6-9 inches to prevent acid reflux during sleep.",
      "Wear loose clothing around your waist to avoid pressure on your stomach.",
      "Chew food thoroughly and eat smaller, more frequent meals."
    ],
    whatToEat: [
      "Oatmeal and whole grains (absorb stomach acid).",
      "Bananas and melons (non-acidic fruits that coat the esophageal lining).",
      "Green vegetables like broccoli, asparagus, green beans, and leafy greens.",
      "Cold skim milk or almond milk (helps neutralize stomach acid).",
      "Fennel seeds or fennel tea (soothes digestion)."
    ],
    whatToAvoid: [
      "Citrus fruits (oranges, lemons, grapefruits) and tomatoes/tomato sauces.",
      "Carbonated drinks, sodas, and energy drinks.",
      "Chocolate, peppermint, and spearmint (they relax the lower esophageal sphincter).",
      "Garlic, onions, and highly spiced or oily foods.",
      "Alcohol, nicotine, and caffeine."
    ],
    seekHelp: "Seek immediate care if heartburn is accompanied by difficulty swallowing, vomiting blood, unexplained weight loss, or if the burning sensation feels like pressure spreading to the arm, neck, or jaw (signs of cardiac distress)."
  },
  {
    keys: ["burn", "scald", "sunburn", "blister", "hot water", "minor burn", "skin burn"],
    disease: "Minor Burn, Sunburn or Scald",
    explanation: "Skin damage caused by heat, chemicals, friction, or UV rays, leading to pain, redness, and swelling. Safe home care is critical to prevent bacterial infection.",
    selfCare: [
      "Hold the burned area under gentle, cool running tap water for 10-15 minutes.",
      "Do not apply ice, butter, oil, or toothpaste to the burn as they trap heat.",
      "Apply pure aloe vera gel or a light, fragrance-free moisturizer after cooling.",
      "Cover the area loosely with a clean, sterile, non-stick gauze bandage.",
      "Never pop or squeeze blisters as they protect the underlying skin from infection."
    ],
    whatToEat: [
      "Protein-rich foods (eggs, chicken, fish, beans) to supply amino acids for skin repair.",
      "Vitamin C-rich fruits (berries, oranges) to promote collagen synthesis.",
      "Foods high in Vitamin E (almonds, sunflower seeds, spinach) to aid skin healing.",
      "Drink extra water to replace lost body fluids (especially for sunburns)."
    ],
    whatToAvoid: [
      "Applying ice directly (can cause tissue frostbite/damage).",
      "Toothpaste, butter, oils, or heavy creams (traps heat and breeds bacteria).",
      "Exposing the healing burn to direct sunlight.",
      "Scratching, peeling, or picking at the healing skin/blisters."
    ],
    seekHelp: "Go to a clinic if the burn covers a major joint, face, hands, feet, or groin, is larger than 3 inches in diameter, is charred/white (third-degree), or shows signs of infection (increased pain, redness, warmth, or pus)."
  },
  {
    keys: ["allergy", "rash", "itching", "hives", "eczema", "bite", "sting", "allergic", "skin rash", "itchy skin"],
    disease: "Allergic Reaction or Skin Rash",
    explanation: "An immune response to contact allergens, foods, pollens, or insect bites, causing histamine release which leads to inflammation, redness, and itching.",
    selfCare: [
      "Wash the affected area gently with cool water and a mild, fragrance-free soap.",
      "Apply a cool damp cloth or cold compress to relieve intense itching.",
      "Apply calamine lotion or an over-the-counter hydrocortisone cream.",
      "Avoid scratching the rash to prevent skin breakage and secondary infections.",
      "Take an over-the-counter oral antihistamine if advised by a pharmacist."
    ],
    whatToEat: [
      "Anti-inflammatory foods (blueberries, walnuts, wild salmon, chia seeds).",
      "Vitamin C-rich foods, which act as a mild, natural antihistamine.",
      "Green tea (contains natural antioxidants and anti-inflammatory properties).",
      "Garlic, ginger, and turmeric to support immune health.",
      "Plenty of pure water to flush out allergen toxins."
    ],
    whatToAvoid: [
      "The specific food, plant, cosmetic, or material that triggered the allergy.",
      "Highly processed foods, high-sugar snacks, and artificial additives.",
      "Scratching the skin with long or dirty fingernails.",
      "Hot showers or baths, which dilate blood vessels and worsen itching."
    ],
    seekHelp: "Seek immediate emergency help if the reaction is accompanied by swelling of the face, lips, tongue, or throat, difficulty breathing, a rapid drop in blood pressure, or dizziness (signs of life-threatening Anaphylaxis)."
  }
];

export const fallbackSymptom = {
  disease: "General Symptom / Discomfort",
  explanation: "Unspecified body aches, fatigue, or general discomfort may be a response to minor muscle strain, fatigue, low hydration, or the early stages of a mild infection.",
  selfCare: [
    "Prioritize rest and aim for at least 7-8 hours of quality sleep.",
    "Stay well-hydrated by drinking 8-10 glasses of water daily.",
    "Perform light stretching or take a warm bath to relax tense muscles.",
    "Keep a daily log of when symptoms occur and their severity."
  ],
  whatToEat: [
    "A balanced diet rich in leafy greens, lean proteins, and whole grains.",
    "Fresh fruits and vegetables to supply essential vitamins.",
    "Hydrating fluids like coconut water, herbal teas, or warm broths."
  ],
  whatToAvoid: [
    "Overexerting yourself physically or mentally.",
    "Highly processed junk food, refined sugars, and saturated fats.",
    "Caffeinated beverages and alcohol, which disrupt sleep and hydration."
  ],
  seekHelp: "Consult a healthcare professional if your symptoms worsen, persist for more than 48 hours without improvement, or significantly interfere with your daily routine."
};

export function lookupSymptom(query) {
  if (!query || typeof query !== 'string') {
    return fallbackSymptom;
  }
  
  const text = query.toLowerCase().trim();
  
  // We will score each entry in symptomDb
  const scored = symptomDb.map(entry => {
    let score = 0;
    
    // 1. Check direct matches of key phrases
    entry.keys.forEach(key => {
      if (text.includes(key)) {
        // High score for exact phrase match
        score += 10;
      }
    });

    // 2. Split query into words to catch variations, stems, and abbreviations
    const words = text.split(/[\s,?.!]+/);
    const stopWords = ["i", "have", "a", "and", "the", "feel", "with", "in", "of", "to", "my", "is", "for", "am", "some", "any", "me", "you"];
    
    words.forEach(word => {
      if (word.length < 3 || stopWords.includes(word)) return;
      
      entry.keys.forEach(key => {
        // Substring checks to align word stems (e.g. "nauseous" matches "nausea" via stem "naus")
        if (key.includes(word) || word.includes(key) || (word.length >= 4 && key.substring(0, 4) === word.substring(0, 4))) {
          score += 3;
        }
      });
    });

    return { entry, score };
  });

  // Sort by score in descending order
  const sorted = scored.sort((a, b) => b.score - a.score);
  const bestMatch = sorted[0];

  // If the best match has a valid matching score, return it
  if (bestMatch && bestMatch.score >= 2) {
    return bestMatch.entry;
  }
  
  return fallbackSymptom;
}
