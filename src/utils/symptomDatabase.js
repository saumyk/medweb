// Shared Medical Symptom & Disease Database for MedWeb

export const symptomDb = [
  {
    keys: ["fever", "temp", "cold", "cough", "flu", "throat", "bronchitis", "shiver", "congestion"],
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
    keys: ["headache", "migraine", "tension", "head ache", "temple pain"],
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
    keys: ["stomach", "belly", "nausea", "vomit", "diarrhea", "cramp", "poisoning", "indigestion", "gastroenteritis", "loose motion"],
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
    keys: ["acidity", "heartburn", "gerd", "acid reflux", "gas"],
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
    keys: ["burn", "scald", "sunburn", "blister", "hot water"],
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
    keys: ["chest", "heart", "breath", "lungs", "stroke", "numb", "cardiac", "dizzy", "unconscious", "collapse"],
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
    keys: ["allergy", "rash", "itching", "hives", "eczema", "bite", "sting"],
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
  
  // Find a matching symptom category based on keys
  const match = symptomDb.find(entry => 
    entry.keys.some(key => text.includes(key))
  );
  
  return match || fallbackSymptom;
}
