# 🏥 MedWeb — Smart Voice-Controlled Health Companion

**MedWeb** is an accessible, voice-enabled personal healthcare companion and medical directory web application. It is designed to simplify how users search for drug guidelines, check symptoms, locate medical facilities, and get health assistance. 

By integrating native browser speech technology with a clean, responsive interface, MedWeb breaks down digital barriers for individuals who struggle with traditional typing and site navigation—such as the elderly, visually impaired, or motor-impaired users.

---

## 🌟 Key Features

*   **🎙️ Hands-Free Voice Controller**: A floating persistent voice assistant widget that parses spoken commands. It speaks back confirmation speech lines and automatically triggers in-app navigation, drug lookups, and symptom checks.
*   **💬 Medical AI Assistant**: A dedicated conversational interface for health queries, incorporating simultaneous voice-typing text transcription for accessibility.
*   **💊 Medicine Information Directory**: A comprehensive guide for safety details, uses, precautions, and recommended dosages, featuring safety indicator tags (Safe, Caution, Unsafe) and critical warning alerts.
*   **🔍 Symptom Guidance Checker**: A quick symptom search providing immediate self-care advice, home remedies, and emergency warning signs indicating when to seek medical help.
*   **📍 Nearby Services Locator**: A directory of local clinics, hospitals, and pharmacies, showing ratings and opening status.
*   **🚨 SOS Emergency Mode**: A critical safety alert trigger (spoken or clicked) that immediately opens a prominent red SOS overlay with emergency guidelines and hospital directories.
*   **🌓 Adaptive Dark & Light Modes**: A modern, glassmorphic design language with responsive layouts and transition animations supporting system dark and light modes.

---

## 🚀 Voice Commands & Actions

MedWeb is navigable hands-free. Users can trigger the floating assistant button and speak the following commands:

*   **Navigation**: `"go home"`, `"go to assistant"`, `"go to medicine"`, `"go to symptoms"`, or `"go to nearby"`.
*   **Automated Searches**: 
    *   *“Search [Drug Name]”* (e.g. *“Search Aspirin”*) — navigates to the medicine directory and filters results.
    *   *“Check [Symptom Name]”* (e.g. *“Check fever”*) — checks symptoms and brings up guidelines.
    *   *“Find [Clinic Type]”* (e.g. *“Find hospital”*) — filters nearby services.
*   **Emergency Trigger**: *“Emergency”* or *“Call ambulance”* — opens the critical SOS alert page.

---

## 🛠️ Technology Stack

MedWeb is built as a zero-cost, serverless web application that utilizes native browser technologies:

*   **React 19 & Vite 8**: Provides component state reactivity and optimized client-side asset loading.
*   **Web Speech API**: Uses browser-native speech recognition (`SpeechRecognition`) and text-to-speech engine speech synthesis (`SpeechSynthesis`) at zero cost.
*   **Framer Motion 12**: Powers smooth micro-animations, transitions, and loading states.
*   **Lucide React**: Supplies clean, high-contrast vector icons for medical and navigation tools.
*   **Vanilla CSS3**: Styles the custom light/dark theme system, glassmorphism, responsive grids, and clean visual cards.
