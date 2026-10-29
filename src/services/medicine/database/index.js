/**
 * database/index.js
 * 
 * Re-exports verified Indian baseline medicines (from CDSCO/NPPA).
 * All international and global medicine details are retrieved dynamically
 * using 100% Free Public APIs (US openFDA, NIH RxNav, NIH DailyMed, Wikimedia).
 */

import { INDIA_MEDICINE_RECORDS } from './indiaRecords';

export const ALL_VERIFIED_MEDICINE_RECORDS = [
  ...INDIA_MEDICINE_RECORDS
];

export {
  INDIA_MEDICINE_RECORDS
};
