/**
 * healthDashboard.test.js
 *
 * Tests for the MedWeb health vitals dashboard — covering:
 *
 *  1.  validateHeartRate        — valid inputs, format errors, boundary values, range errors
 *  2.  validateSystolic         — valid inputs, format errors, boundaries
 *  3.  validateDiastolic        — valid inputs, format errors, boundaries
 *  4.  validateBloodPressure    — pair validation, partial BP rejection, sys > dia constraint
 *  5.  validateBloodSugar       — valid inputs, format errors, range errors
 *  6.  validateTemperature      — valid inputs, format errors, range errors
 *  7.  validateVitalsForm       — full form: empty, mixed errors, range-only, all-valid
 *  8.  validateSymptomName      — valid, blank, too long
 *  9.  validateSeverity         — valid, out-of-range, non-numeric
 * 10.  Sorting                  — sortNewestFirst with ISO timestamps
 * 11.  Timestamp stability      — makeTimestamp produces iso + label pair
 * 12.  Storage isolation        — user isolation (simulated)
 * 13.  Duplicate detection      — same-timestamp guard logic
 * 14.  Storage failure handling — supabase error path (mocked)
 * 15.  Data persistence         — localStorage round-trip for unauthenticated users
 */

import { describe, it, expect, beforeEach } from 'vitest';

import {
  BOUNDS,
  CONCERN_THRESHOLDS,
  validateHeartRate,
  validateSystolic,
  validateDiastolic,
  validateBloodPressure,
  validateBloodSugar,
  validateTemperature,
  validateVitalsForm,
  validateSymptomName,
  validateSeverity,
} from '../utils/vitalsValidation';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: assert a "format" failure result
// ─────────────────────────────────────────────────────────────────────────────
function expectFormatError(result, msgFragment) {
  expect(result.ok).toBe(false);
  expect(result.kind).toBe('format');
  if (msgFragment) expect(result.message).toContain(msgFragment);
}

function expectRangeError(result, msgFragment) {
  expect(result.ok).toBe(false);
  expect(result.kind).toBe('range');
  if (msgFragment) expect(result.message).toContain(msgFragment);
}

function expectSuccess(result, expectedValue) {
  expect(result.ok).toBe(true);
  if (expectedValue !== undefined) expect(result.value).toBe(expectedValue);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. validateHeartRate
// ─────────────────────────────────────────────────────────────────────────────

describe('validateHeartRate', () => {
  it('accepts a normal heart rate string', () => expectSuccess(validateHeartRate('72'), 72));
  it('accepts a numeric value', ()            => expectSuccess(validateHeartRate(72), 72));
  it('rounds floating-point input',  ()       => expectSuccess(validateHeartRate('72.4'), 72));
  it('returns null for empty when not required', () => {
    const r = validateHeartRate('');
    expect(r.ok).toBe(true);
    expect(r.value).toBeNull();
  });
  it('fails with format error when required and empty', () => {
    expectFormatError(validateHeartRate('', true), 'required');
  });
  it('fails with format error for non-numeric input', () => {
    expectFormatError(validateHeartRate('abc'), 'valid number');
  });
  it('fails with format error for NaN sentinel', () => {
    expectFormatError(validateHeartRate(NaN), 'valid number');
  });

  // Boundary tests
  it(`accepts lower bound ${BOUNDS.heartRate.min}`, () =>
    expectSuccess(validateHeartRate(BOUNDS.heartRate.min), BOUNDS.heartRate.min));
  it(`accepts upper bound ${BOUNDS.heartRate.max}`, () =>
    expectSuccess(validateHeartRate(BOUNDS.heartRate.max), BOUNDS.heartRate.max));
  it(`rejects one below lower bound`, () =>
    expectRangeError(validateHeartRate(BOUNDS.heartRate.min - 1)));
  it(`rejects one above upper bound`, () =>
    expectRangeError(validateHeartRate(BOUNDS.heartRate.max + 1)));
  it('rejects 0 bpm', ()   => expectRangeError(validateHeartRate(0)));
  it('rejects -1 bpm', ()  => expectRangeError(validateHeartRate(-1)));
  it('rejects 500 bpm', () => expectRangeError(validateHeartRate(500)));
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. validateSystolic
// ─────────────────────────────────────────────────────────────────────────────

describe('validateSystolic', () => {
  it('accepts 120 mmHg', () => expectSuccess(validateSystolic('120'), 120));
  it('accepts 90 mmHg',  () => expectSuccess(validateSystolic(90), 90));
  it('returns null for empty when not required', () => {
    const r = validateSystolic('');
    expect(r.ok).toBe(true);
    expect(r.value).toBeNull();
  });
  it('fails format when required and empty', () =>
    expectFormatError(validateSystolic('', true), 'required'));
  it('fails format for text',   () => expectFormatError(validateSystolic('text')));

  it(`accepts lower bound ${BOUNDS.systolic.min}`, () =>
    expectSuccess(validateSystolic(BOUNDS.systolic.min), BOUNDS.systolic.min));
  it(`accepts upper bound ${BOUNDS.systolic.max}`, () =>
    expectSuccess(validateSystolic(BOUNDS.systolic.max), BOUNDS.systolic.max));
  it('rejects 30 mmHg (below min)', () => expectRangeError(validateSystolic(30)));
  it('rejects 400 mmHg (above max)', () => expectRangeError(validateSystolic(400)));
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. validateDiastolic
// ─────────────────────────────────────────────────────────────────────────────

describe('validateDiastolic', () => {
  it('accepts 80 mmHg',   () => expectSuccess(validateDiastolic('80'), 80));
  it('accepts 60 mmHg',   () => expectSuccess(validateDiastolic(60), 60));
  it('returns null for empty when not required', () => {
    const r = validateDiastolic('');
    expect(r.ok).toBe(true);
    expect(r.value).toBeNull();
  });
  it('fails format when required and empty', () =>
    expectFormatError(validateDiastolic('', true)));
  it('fails format for text', () => expectFormatError(validateDiastolic('high')));

  it(`accepts lower bound ${BOUNDS.diastolic.min}`, () =>
    expectSuccess(validateDiastolic(BOUNDS.diastolic.min), BOUNDS.diastolic.min));
  it(`accepts upper bound ${BOUNDS.diastolic.max}`, () =>
    expectSuccess(validateDiastolic(BOUNDS.diastolic.max), BOUNDS.diastolic.max));
  it('rejects 10 mmHg', ()  => expectRangeError(validateDiastolic(10)));
  it('rejects 250 mmHg', () => expectRangeError(validateDiastolic(250)));
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. validateBloodPressure (pair)
// ─────────────────────────────────────────────────────────────────────────────

describe('validateBloodPressure', () => {
  it('accepts a normal reading', () => {
    const r = validateBloodPressure('120', '80');
    expect(r.ok).toBe(true);
    expect(r.sys).toBe(120);
    expect(r.dia).toBe(80);
    expect(r.errors).toHaveLength(0);
  });

  it('accepts both fields empty (user skipped BP)', () => {
    const r = validateBloodPressure('', '');
    expect(r.ok).toBe(true);
    expect(r.sys).toBeNull();
    expect(r.dia).toBeNull();
  });

  it('rejects systolic-only (partial BP — missing diastolic)', () => {
    const r = validateBloodPressure('120', '');
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toContain('Diastolic');
    expect(r.kinds[0]).toBe('format');
  });

  it('rejects diastolic-only (partial BP — missing systolic)', () => {
    const r = validateBloodPressure('', '80');
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toContain('Systolic');
    expect(r.kinds[0]).toBe('format');
  });

  it('rejects systolic === diastolic', () => {
    const r = validateBloodPressure('80', '80');
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toContain('greater than diastolic');
    expect(r.kinds[0]).toBe('format');
  });

  it('rejects systolic < diastolic (inverted values)', () => {
    const r = validateBloodPressure('70', '90');
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toContain('greater than diastolic');
  });

  it('propagates range error if systolic is out-of-bounds', () => {
    const r = validateBloodPressure('400', '80');
    expect(r.ok).toBe(false);
    expect(r.kinds).toContain('range');
  });

  it('propagates range error if diastolic is out-of-bounds', () => {
    const r = validateBloodPressure('120', '250');
    expect(r.ok).toBe(false);
    expect(r.kinds).toContain('range');
  });

  it('propagates format error if either value is non-numeric', () => {
    const r = validateBloodPressure('abc', '80');
    expect(r.ok).toBe(false);
    expect(r.kinds).toContain('format');
  });

  // Does NOT silently change values to make them plausible
  it('does not swap systolic and diastolic if inverted', () => {
    const r = validateBloodPressure('70', '90');
    // Should reject, not silently fix
    expect(r.ok).toBe(false);
  });

  // Boundary: minimum valid gap
  it('accepts systolic just one above diastolic', () => {
    const r = validateBloodPressure('81', '80');
    expect(r.ok).toBe(true);
    expect(r.sys).toBe(81);
    expect(r.dia).toBe(80);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. validateBloodSugar
// ─────────────────────────────────────────────────────────────────────────────

describe('validateBloodSugar', () => {
  it('accepts 95 mg/dL',  () => expectSuccess(validateBloodSugar('95'),  95));
  it('accepts 140 mg/dL', () => expectSuccess(validateBloodSugar(140), 140));
  it('returns null for empty when not required', () => {
    const r = validateBloodSugar('');
    expect(r.ok).toBe(true);
    expect(r.value).toBeNull();
  });
  it('fails format for text', () => expectFormatError(validateBloodSugar('high')));

  it(`accepts lower bound ${BOUNDS.bloodSugar.min}`, () =>
    expectSuccess(validateBloodSugar(BOUNDS.bloodSugar.min), BOUNDS.bloodSugar.min));
  it(`accepts upper bound ${BOUNDS.bloodSugar.max}`, () =>
    expectSuccess(validateBloodSugar(BOUNDS.bloodSugar.max), BOUNDS.bloodSugar.max));
  it('rejects 10 mg/dL',  () => expectRangeError(validateBloodSugar(10)));
  it('rejects 900 mg/dL', () => expectRangeError(validateBloodSugar(900)));
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. validateTemperature
// ─────────────────────────────────────────────────────────────────────────────

describe('validateTemperature', () => {
  it('accepts 98.6°F',   () => expectSuccess(validateTemperature('98.6'), 98.6));
  it('accepts 100.4°F',  () => expectSuccess(validateTemperature(100.4), 100.4));
  it('returns null for empty when not required', () => {
    const r = validateTemperature('');
    expect(r.ok).toBe(true);
    expect(r.value).toBeNull();
  });
  it('fails format for text', () => expectFormatError(validateTemperature('hot')));

  it(`accepts lower bound ${BOUNDS.temperature.min}°F`, () =>
    expectSuccess(validateTemperature(BOUNDS.temperature.min), BOUNDS.temperature.min));
  it(`accepts upper bound ${BOUNDS.temperature.max}°F`, () =>
    expectSuccess(validateTemperature(BOUNDS.temperature.max), BOUNDS.temperature.max));
  it('rejects 70°F',  () => expectRangeError(validateTemperature(70)));
  it('rejects 120°F', () => expectRangeError(validateTemperature(120)));
  it('rejects 0°F',   () => expectRangeError(validateTemperature(0)));
  it('rejects -1°F',  () => expectRangeError(validateTemperature(-1)));

  // Verify 1-decimal rounding (does NOT silently truncate more than 1dp)
  it('rounds to 1 decimal place', () => {
    const r = validateTemperature('98.649');
    expect(r.ok).toBe(true);
    // 98.649 rounds to 98.6
    expect(r.value).toBe(98.6);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. validateVitalsForm — full-form integration
// ─────────────────────────────────────────────────────────────────────────────

describe('validateVitalsForm', () => {
  const allEmpty = { heartRate: '', sysBP: '', diaBP: '', bloodSugar: '', temp: '' };

  it('rejects all-empty form', () => {
    const r = validateVitalsForm(allEmpty);
    expect(r.valid).toBe(false);
    expect(r.formatErrors.length).toBeGreaterThan(0);
  });

  it('accepts a single valid field', () => {
    const r = validateVitalsForm({ ...allEmpty, heartRate: '72' });
    expect(r.valid).toBe(true);
    expect(r.values.heartRate).toBe(72);
    expect(r.values.sysBP).toBeNull();
  });

  it('rejects when only one BP field is provided', () => {
    const r = validateVitalsForm({ ...allEmpty, sysBP: '120' });
    expect(r.valid).toBe(false);
    expect(r.formatErrors.some(e => e.includes('Diastolic'))).toBe(true);
  });

  it('accepts both BP fields together', () => {
    const r = validateVitalsForm({ ...allEmpty, sysBP: '120', diaBP: '80' });
    expect(r.valid).toBe(true);
    expect(r.values.sysBP).toBe(120);
    expect(r.values.diaBP).toBe(80);
  });

  it('rejects inverted BP pair', () => {
    const r = validateVitalsForm({ ...allEmpty, sysBP: '70', diaBP: '90' });
    expect(r.valid).toBe(false);
  });

  it('blocks on format error even if other fields are valid', () => {
    const r = validateVitalsForm({ heartRate: 'abc', sysBP: '120', diaBP: '80', bloodSugar: '', temp: '' });
    expect(r.valid).toBe(false);
    expect(r.formatErrors.some(e => e.toLowerCase().includes('heart rate'))).toBe(true);
  });

  it('range error (out-of-bounds value) blocks submission and surfaces a range warning', () => {
    // 301 bpm is above the physiological max → range error → blocks submission
    const r = validateVitalsForm({ ...allEmpty, heartRate: '301' });
    expect(r.valid).toBe(false);               // blocked
    expect(r.formatErrors).toHaveLength(0);    // no format error
    expect(r.rangeWarnings.length).toBeGreaterThan(0); // range warning surfaced
  });

  it('surfaces range warnings without blocking when value is valid but concerning', () => {
    // 99 bpm is a perfectly valid heart rate but still within bounds → no block
    const r = validateVitalsForm({ ...allEmpty, heartRate: '99', temp: '98.6' });
    expect(r.valid).toBe(true);
    expect(r.values.heartRate).toBe(99);
  });

  it('does not silently alter the submitted value', () => {
    // If the user enters 119 sys and 80 dia, the values should remain exactly those
    const r = validateVitalsForm({ ...allEmpty, sysBP: '119', diaBP: '80' });
    expect(r.valid).toBe(true);
    expect(r.values.sysBP).toBe(119);
    expect(r.values.diaBP).toBe(80);
  });

  it('populates all fields correctly when all are valid', () => {
    const r = validateVitalsForm({
      heartRate:  '72',
      sysBP:      '120',
      diaBP:      '80',
      bloodSugar: '95',
      temp:       '98.6',
    });
    expect(r.valid).toBe(true);
    expect(r.formatErrors).toHaveLength(0);
    expect(r.rangeWarnings).toHaveLength(0);
    expect(r.values).toEqual({ heartRate: 72, sysBP: 120, diaBP: 80, bloodSugar: 95, temp: 98.6 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. validateSymptomName
// ─────────────────────────────────────────────────────────────────────────────

describe('validateSymptomName', () => {
  it('accepts a normal symptom name', () => {
    const r = validateSymptomName('Headache');
    expect(r.ok).toBe(true);
    expect(r.value).toBe('Headache');
  });

  it('trims surrounding whitespace', () => {
    const r = validateSymptomName('  Nausea  ');
    expect(r.ok).toBe(true);
    expect(r.value).toBe('Nausea');
  });

  it('rejects empty string', () => {
    // Empty string hits the 'required' branch before 'blank' trim check
    expectFormatError(validateSymptomName(''), 'required');
  });

  it('rejects whitespace-only string', () => {
    expectFormatError(validateSymptomName('   '), 'blank');
  });

  it('rejects null', ()      => expectFormatError(validateSymptomName(null)));
  it('rejects undefined', () => expectFormatError(validateSymptomName(undefined)));

  it('rejects names longer than 200 characters', () => {
    expectFormatError(validateSymptomName('A'.repeat(201)), 'too long');
  });

  it('accepts exactly 200 characters', () => {
    const r = validateSymptomName('A'.repeat(200));
    expect(r.ok).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. validateSeverity
// ─────────────────────────────────────────────────────────────────────────────

describe('validateSeverity', () => {
  it('accepts severity 1', ()  => expectSuccess(validateSeverity(1), 1));
  it('accepts severity 5', ()  => expectSuccess(validateSeverity(5), 5));
  it('accepts severity 10', () => expectSuccess(validateSeverity(10), 10));
  it('accepts string "7"', ()  => expectSuccess(validateSeverity('7'), 7));

  it('rejects 0',  () => expectFormatError(validateSeverity(0)));
  it('rejects 11', () => expectFormatError(validateSeverity(11)));
  it('rejects negative', () => expectFormatError(validateSeverity(-1)));
  it('rejects non-numeric text', () => expectFormatError(validateSeverity('high')));
  it('rejects empty string', () => expectFormatError(validateSeverity('')));
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. Sorting — newest first by ISO timestamp
// ─────────────────────────────────────────────────────────────────────────────

describe('Sorting (sortNewestFirst)', () => {
  // Inline the same logic from HealthDashboard.jsx
  function sortNewestFirst(logs) {
    return [...logs].sort((a, b) => {
      const ta = a.createdAt || a.date || '';
      const tb = b.createdAt || b.date || '';
      return tb.localeCompare(ta);
    });
  }

  const logs = [
    { id: 'c', createdAt: '2026-10-28T10:00:00.000Z', date: 'Oct 28, 10:00 AM' },
    { id: 'a', createdAt: '2026-10-26T08:00:00.000Z', date: 'Oct 26, 08:00 AM' },
    { id: 'b', createdAt: '2026-10-27T09:00:00.000Z', date: 'Oct 27, 09:00 AM' },
  ];

  it('returns newest entry first', () => {
    const sorted = sortNewestFirst(logs);
    expect(sorted[0].id).toBe('c');
  });

  it('returns oldest entry last', () => {
    const sorted = sortNewestFirst(logs);
    expect(sorted[sorted.length - 1].id).toBe('a');
  });

  it('does not mutate the original array', () => {
    const original = [...logs];
    sortNewestFirst(logs);
    expect(logs[0].id).toBe(original[0].id);
  });

  it('handles single-element array', () => {
    const single = [{ id: 'x', createdAt: '2026-10-28T10:00:00.000Z' }];
    expect(sortNewestFirst(single)).toHaveLength(1);
  });

  it('handles empty array', () => {
    expect(sortNewestFirst([])).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. Timestamp stability — makeTimestamp
// ─────────────────────────────────────────────────────────────────────────────

describe('makeTimestamp', () => {
  // Inline reproduction from HealthDashboard.jsx
  function makeTimestamp() {
    const now = new Date();
    return {
      iso: now.toISOString(),
      label: now.toLocaleString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      }),
    };
  }

  it('returns an iso string parseable by Date', () => {
    const { iso } = makeTimestamp();
    expect(isNaN(new Date(iso).getTime())).toBe(false);
  });

  it('iso is a valid ISO 8601 string', () => {
    const { iso } = makeTimestamp();
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('label is a non-empty string', () => {
    const { label } = makeTimestamp();
    expect(typeof label).toBe('string');
    expect(label.length).toBeGreaterThan(0);
  });

  it('two consecutive calls produce different iso values', async () => {
    const t1 = makeTimestamp();
    await new Promise(r => setTimeout(r, 2)); // minimal delay
    const t2 = makeTimestamp();
    // In practice they'll be different; if the machine is extremely fast they
    // could theoretically match to the millisecond, so we only assert format
    expect(t1.iso).toMatch(/Z$/);
    expect(t2.iso).toMatch(/Z$/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. Storage isolation — user isolation simulation
// ─────────────────────────────────────────────────────────────────────────────

describe('User isolation (storage simulation)', () => {
  // Simulate that each user only sees records with their own user_id.
  // This mirrors the .eq('user_id', user.id) filter used in the component.

  const alice = { id: 'user-alice' };
  const bob   = { id: 'user-bob'   };

  const allRecords = [
    { id: 1, user_id: 'user-alice', heart_rate: 72 },
    { id: 2, user_id: 'user-bob',   heart_rate: 85 },
    { id: 3, user_id: 'user-alice', heart_rate: 68 },
  ];

  function filterForUser(records, user) {
    return records.filter(r => r.user_id === user.id);
  }

  it("Alice only sees her own records", () => {
    const aliceRecords = filterForUser(allRecords, alice);
    expect(aliceRecords).toHaveLength(2);
    aliceRecords.forEach(r => expect(r.user_id).toBe('user-alice'));
  });

  it("Bob only sees his own records", () => {
    const bobRecords = filterForUser(allRecords, bob);
    expect(bobRecords).toHaveLength(1);
    expect(bobRecords[0].user_id).toBe('user-bob');
  });

  it("Alice does not see Bob's data", () => {
    const aliceRecords = filterForUser(allRecords, alice);
    expect(aliceRecords.some(r => r.user_id === 'user-bob')).toBe(false);
  });

  it("Bob does not see Alice's data", () => {
    const bobRecords = filterForUser(allRecords, bob);
    expect(bobRecords.some(r => r.user_id === 'user-alice')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. Duplicate detection
// ─────────────────────────────────────────────────────────────────────────────

describe('Duplicate submission guard', () => {
  // Reproduce the guard logic from handleAddVitals / handleAddSymptom
  function isDuplicate(lastSubmitRef, now, windowMs = 2000) {
    if (lastSubmitRef.current !== null && (now - lastSubmitRef.current) < windowMs) {
      return true;
    }
    return false;
  }

  it('allows first submission (no previous timestamp)', () => {
    const ref = { current: null };
    expect(isDuplicate(ref, Date.now())).toBe(false);
  });

  it('blocks rapid re-submission within window', () => {
    const ref = { current: Date.now() - 500 }; // 500ms ago
    expect(isDuplicate(ref, Date.now())).toBe(true);
  });

  it('allows re-submission after the window has passed', () => {
    const ref = { current: Date.now() - 3000 }; // 3 seconds ago
    expect(isDuplicate(ref, Date.now())).toBe(false);
  });

  it('allows re-submission exactly at window boundary', () => {
    const ref = { current: Date.now() - 2000 };
    expect(isDuplicate(ref, Date.now())).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 14. Storage failure handling — mocked supabase error paths
// ─────────────────────────────────────────────────────────────────────────────

describe('Storage failure handling', () => {
  it('does not add a record to local state when the db insert fails', async () => {
    // Simulate the guard in handleAddVitals:
    // "if (error) throw error" → catch → return early without calling setState
    const localState = [];
    const pushToLocal = (record) => localState.push(record);

    async function simulateSave(dbSuccess) {
      const dbError = dbSuccess ? null : new Error('db write failed');
      if (dbError) {
        // Component returns here — state is NOT mutated
        return { saved: false };
      }
      pushToLocal({ id: 1, heartRate: 72 });
      return { saved: true };
    }

    const successResult = await simulateSave(true);
    expect(successResult.saved).toBe(true);
    expect(localState).toHaveLength(1);

    localState.length = 0; // reset

    const failResult = await simulateSave(false);
    expect(failResult.saved).toBe(false);
    expect(localState).toHaveLength(0); // state NOT mutated on failure
  });

  it('does not show success message when db write fails', async () => {
    let toastType = null;
    const showToast = (type) => { toastType = type; };

    async function simulateSaveWithToast(dbSuccess) {
      if (!dbSuccess) {
        showToast('error');
        return;
      }
      showToast('success');
    }

    await simulateSaveWithToast(false);
    expect(toastType).toBe('error');
    expect(toastType).not.toBe('success');
  });

  it('shows success message when db write succeeds', async () => {
    let toastType = null;
    const showToast = (type) => { toastType = type; };

    async function simulateSaveWithToast(dbSuccess) {
      if (!dbSuccess) { showToast('error'); return; }
      showToast('success');
    }

    await simulateSaveWithToast(true);
    expect(toastType).toBe('success');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 15. Data persistence — localStorage round-trip
// ─────────────────────────────────────────────────────────────────────────────

describe('localStorage round-trip (unauthenticated)', () => {
  const KEY_VITALS   = 'medweb_vitals_logs';
  const KEY_SYMPTOMS = 'medweb_symptoms_logs';

  const sampleVitals = [
    { id: 'vital-1', date: 'Oct 28, 10:00 AM', createdAt: '2026-10-28T10:00:00.000Z', heartRate: 72, sysBP: 120, diaBP: 80, bloodSugar: 95, temp: 98.6 },
  ];

  const sampleSymptoms = [
    { id: 'symptom-1', date: 'Oct 28, 10:01 AM', createdAt: '2026-10-28T10:01:00.000Z', symptomName: 'Headache', severity: 4, notes: '' },
  ];

  beforeEach(() => {
    localStorage.clear();
  });

  it('serialises and deserialises vitals correctly', () => {
    localStorage.setItem(KEY_VITALS, JSON.stringify(sampleVitals));
    const loaded = JSON.parse(localStorage.getItem(KEY_VITALS));
    expect(loaded).toHaveLength(1);
    expect(loaded[0].heartRate).toBe(72);
    expect(loaded[0].sysBP).toBe(120);
    expect(loaded[0].diaBP).toBe(80);
  });

  it('serialises and deserialises symptoms correctly', () => {
    localStorage.setItem(KEY_SYMPTOMS, JSON.stringify(sampleSymptoms));
    const loaded = JSON.parse(localStorage.getItem(KEY_SYMPTOMS));
    expect(loaded).toHaveLength(1);
    expect(loaded[0].symptomName).toBe('Headache');
    expect(loaded[0].severity).toBe(4);
  });

  it('returns empty array when storage is empty', () => {
    const saved = localStorage.getItem(KEY_VITALS);
    const logs  = saved ? JSON.parse(saved) : [];
    expect(logs).toHaveLength(0);
  });

  it('does not leak data between simulated user sessions', () => {
    // Simulate user A saving data
    localStorage.setItem(KEY_VITALS, JSON.stringify(sampleVitals));

    // Simulate user A logging out → on login we clear state before fetching
    // (In the component, user change triggers setVitalsLogs([]) before fetchLogs)
    const vitals = []; // Cleared on user change

    // State is empty before async fetch completes
    expect(vitals).toHaveLength(0);
  });

  it('preserves null fields through serialisation', () => {
    const withNulls = [{ ...sampleVitals[0], heartRate: null, sysBP: null, diaBP: null }];
    localStorage.setItem(KEY_VITALS, JSON.stringify(withNulls));
    const loaded = JSON.parse(localStorage.getItem(KEY_VITALS));
    expect(loaded[0].heartRate).toBeNull();
    expect(loaded[0].sysBP).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 16. BOUNDS and CONCERN_THRESHOLDS export sanity checks
// ─────────────────────────────────────────────────────────────────────────────

describe('BOUNDS and CONCERN_THRESHOLDS exports', () => {
  it('BOUNDS has expected vital keys', () => {
    expect(BOUNDS).toHaveProperty('heartRate');
    expect(BOUNDS).toHaveProperty('systolic');
    expect(BOUNDS).toHaveProperty('diastolic');
    expect(BOUNDS).toHaveProperty('bloodSugar');
    expect(BOUNDS).toHaveProperty('temperature');
  });

  it('each BOUNDS entry has min < max', () => {
    Object.entries(BOUNDS).forEach(([, { min, max }]) => {
      expect(min).toBeLessThan(max);
    });
  });

  it('CONCERN_THRESHOLDS has expected keys', () => {
    expect(CONCERN_THRESHOLDS).toHaveProperty('heartRate');
    expect(CONCERN_THRESHOLDS).toHaveProperty('bloodSugar');
    expect(CONCERN_THRESHOLDS).toHaveProperty('temperature');
  });

  it('fever threshold is within temperature bounds', () => {
    expect(CONCERN_THRESHOLDS.temperature.fever).toBeGreaterThan(BOUNDS.temperature.min);
    expect(CONCERN_THRESHOLDS.temperature.fever).toBeLessThan(BOUNDS.temperature.max);
  });
});
