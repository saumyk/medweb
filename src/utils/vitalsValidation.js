/**
 * vitalsValidation.js
 *
 * Pure, side-effect-free validation for health vitals.
 *
 * Validation results are plain objects:
 *   { ok: true, value: <number> }
 *   { ok: false, kind: 'format' | 'range', message: <string> }
 *
 * 'format' — the input is not a valid number or is empty when required.
 * 'range'  — the number is outside physiologically plausible bounds.
 *            This does NOT mean the user is healthy or unhealthy; it means
 *            the value is implausible as a real measurement.
 *
 * Health-concern warnings (e.g. high blood sugar) are separate and computed
 * only after validation succeeds.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse a raw string input into a finite float.
 * Returns null if the input is blank/empty.
 * Returns NaN if parsing fails.
 */
function parseNumeric(raw) {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (s === '') return null;
  const n = Number(s);
  return n;
}

/**
 * Build a successful validation result.
 */
function ok(value) {
  return { ok: true, value };
}

/**
 * Build a failed validation result.
 */
function fail(kind, message) {
  return { ok: false, kind, message };
}

// ─────────────────────────────────────────────────────────────────────────────
// Physiological bounds (inclusive)
// These are the widest plausible values for a living adult.
// ─────────────────────────────────────────────────────────────────────────────

export const BOUNDS = {
  heartRate: { min: 20, max: 300 },
  systolic:  { min: 50, max: 300 },
  diastolic: { min: 20, max: 200 },
  bloodSugar: { min: 20, max: 800 },
  temperature: { min: 85, max: 115 },
};

// Health-concern thresholds (informational)
export const CONCERN_THRESHOLDS = {
  heartRate: { low: 60, high: 100 },
  systolic: { normal: 120, elevated: 130, high: 140 },
  diastolic: { normal: 80, high: 90 },
  bloodSugar: { fasting_high: 100, post_high: 140, diabetic: 200 },
  temperature: { fever: 100.4, high_fever: 103 },
};

// ─────────────────────────────────────────────────────────────────────────────
// Individual field validators
// ─────────────────────────────────────────────────────────────────────────────

export function validateHeartRate(raw, required = false) {
  const n = parseNumeric(raw);
  if (n === null) {
    return required ? fail('format', 'Heart rate is required.') : ok(null);
  }
  if (!isFinite(n) || isNaN(n)) {
    return fail('format', 'Heart rate must be a valid number (e.g. 72).');
  }
  const v = Math.round(n);
  const { min, max } = BOUNDS.heartRate;
  if (v < min || v > max) {
    return fail('range', `Heart rate ${v} bpm is outside the plausible range (${min}–${max} bpm).`);
  }
  return ok(v);
}

export function validateSystolic(raw, required = false) {
  const n = parseNumeric(raw);
  if (n === null) {
    return required ? fail('format', 'Systolic blood pressure is required.') : ok(null);
  }
  if (!isFinite(n) || isNaN(n)) {
    return fail('format', 'Systolic pressure must be a valid number (e.g. 120).');
  }
  const v = Math.round(n);
  const { min, max } = BOUNDS.systolic;
  if (v < min || v > max) {
    return fail('range', `Systolic pressure ${v} mmHg is outside the plausible range (${min}–${max} mmHg).`);
  }
  return ok(v);
}

export function validateDiastolic(raw, required = false) {
  const n = parseNumeric(raw);
  if (n === null) {
    return required ? fail('format', 'Diastolic blood pressure is required.') : ok(null);
  }
  if (!isFinite(n) || isNaN(n)) {
    return fail('format', 'Diastolic pressure must be a valid number (e.g. 80).');
  }
  const v = Math.round(n);
  const { min, max } = BOUNDS.diastolic;
  if (v < min || v > max) {
    return fail('range', `Diastolic pressure ${v} mmHg is outside the plausible range (${min}–${max} mmHg).`);
  }
  return ok(v);
}

/**
 * Validate blood pressure pair.
 * Both must be provided together, and systolic must be > diastolic.
 */
export function validateBloodPressure(rawSys, rawDia) {
  const sysResult = validateSystolic(rawSys);
  const diaResult = validateDiastolic(rawDia);

  const errors = [];
  const kinds = [];

  if (!sysResult.ok) { errors.push(sysResult.message); kinds.push(sysResult.kind); }
  if (!diaResult.ok) { errors.push(diaResult.message); kinds.push(diaResult.kind); }

  if (errors.length > 0) {
    return { ok: false, errors, kinds };
  }

  const sys = sysResult.value;
  const dia = diaResult.value;

  // Both absent is fine (user skipped BP)
  if (sys === null && dia === null) {
    return { ok: true, sys: null, dia: null, errors: [], kinds: [] };
  }

  // Only one provided — partial BP is rejected
  if (sys === null && dia !== null) {
    return {
      ok: false,
      errors: ['Systolic pressure is required when diastolic is entered.'],
      kinds: ['format'],
    };
  }
  if (sys !== null && dia === null) {
    return {
      ok: false,
      errors: ['Diastolic pressure is required when systolic is entered.'],
      kinds: ['format'],
    };
  }

  // Both provided: systolic must exceed diastolic
  if (sys <= dia) {
    return {
      ok: false,
      errors: [
        `Systolic (${sys} mmHg) must be greater than diastolic (${dia} mmHg). Please check your readings.`,
      ],
      kinds: ['format'],
    };
  }

  return { ok: true, sys, dia, errors: [], kinds: [] };
}

export function validateBloodSugar(raw, required = false) {
  const n = parseNumeric(raw);
  if (n === null) {
    return required ? fail('format', 'Blood sugar is required.') : ok(null);
  }
  if (!isFinite(n) || isNaN(n)) {
    return fail('format', 'Blood sugar must be a valid number (e.g. 95).');
  }
  const v = Math.round(n);
  const { min, max } = BOUNDS.bloodSugar;
  if (v < min || v > max) {
    return fail('range', `Blood sugar ${v} mg/dL is outside the plausible range (${min}–${max} mg/dL).`);
  }
  return ok(v);
}

export function validateTemperature(raw, required = false) {
  const n = parseNumeric(raw);
  if (n === null) {
    return required ? fail('format', 'Temperature is required.') : ok(null);
  }
  if (!isFinite(n) || isNaN(n)) {
    return fail('format', 'Temperature must be a valid number in °F (e.g. 98.6).');
  }
  const v = Math.round(n * 10) / 10;
  const { min, max } = BOUNDS.temperature;
  if (v < min || v > max) {
    return fail('range', `Temperature ${v}°F is outside the plausible range (${min}–${max}°F).`);
  }
  return ok(v);
}

// ─────────────────────────────────────────────────────────────────────────────
// Full vitals form validator
// ─────────────────────────────────────────────────────────────────────────────

export function validateVitalsForm({ heartRate, sysBP, diaBP, bloodSugar, temp }) {
  const formatErrors = [];
  const rangeWarnings = [];
  const values = { heartRate: null, sysBP: null, diaBP: null, bloodSugar: null, temp: null };

  const hrResult = validateHeartRate(heartRate);
  if (!hrResult.ok) {
    if (hrResult.kind === 'format') formatErrors.push(hrResult.message);
    else rangeWarnings.push(hrResult.message);
  } else {
    values.heartRate = hrResult.value;
  }

  const bpResult = validateBloodPressure(sysBP, diaBP);
  if (!bpResult.ok) {
    bpResult.errors.forEach((msg, i) => {
      if (bpResult.kinds[i] === 'format') formatErrors.push(msg);
      else rangeWarnings.push(msg);
    });
  } else {
    values.sysBP = bpResult.sys;
    values.diaBP = bpResult.dia;
  }

  const bsResult = validateBloodSugar(bloodSugar);
  if (!bsResult.ok) {
    if (bsResult.kind === 'format') formatErrors.push(bsResult.message);
    else rangeWarnings.push(bsResult.message);
  } else {
    values.bloodSugar = bsResult.value;
  }

  const tempResult = validateTemperature(temp);
  if (!tempResult.ok) {
    if (tempResult.kind === 'format') formatErrors.push(tempResult.message);
    else rangeWarnings.push(tempResult.message);
  } else {
    values.temp = tempResult.value;
  }

  const hasAnyValue = Object.values(values).some(v => v !== null);

  if (!hasAnyValue && formatErrors.length === 0 && rangeWarnings.length === 0) {
    return {
      valid: false,
      formatErrors: ['Please enter at least one vital measurement.'],
      rangeWarnings: [],
      values,
    };
  }

  if (formatErrors.length > 0 || rangeWarnings.length > 0) {
    // Both format errors and range errors (implausible values) block submission.
    // rangeWarnings are surfaced so the UI can display them distinctly from
    // format errors, but neither kind is silently accepted.
    return { valid: false, formatErrors, rangeWarnings, values };
  }

  return { valid: true, formatErrors: [], rangeWarnings: [], values };
}

// ─────────────────────────────────────────────────────────────────────────────
// Symptom validators
// ─────────────────────────────────────────────────────────────────────────────

export function validateSymptomName(name) {
  if (!name || typeof name !== 'string') {
    return fail('format', 'Symptom name is required.');
  }
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return fail('format', 'Symptom name cannot be blank.');
  }
  if (trimmed.length > 200) {
    return fail('format', 'Symptom name is too long (max 200 characters).');
  }
  return ok(trimmed);
}

export function validateSeverity(raw) {
  const n = parseNumeric(raw);
  if (n === null || isNaN(n) || !isFinite(n)) {
    return fail('format', 'Severity must be a number between 1 and 10.');
  }
  const v = Math.round(n);
  if (v < 1 || v > 10) {
    return fail('format', `Severity ${v} is outside the valid range (1–10).`);
  }
  return ok(v);
}
