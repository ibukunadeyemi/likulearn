/**
 * Fixed choices in the registration form, shared by the browser script and the API
 * that validates submissions. Plans and subjects are edited in the CMS instead.
 */
export const CLASS_TYPES = ['1-on-1', 'Small group'];
export const TIMES = ['Morning', 'Afternoon', 'Evening'];
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const TIMEZONES = ['GMT / UTC', 'West Africa (WAT)', 'Central Europe (CET)', 'US Eastern (ET)', 'US Pacific (PT)', 'Gulf (GST)', 'India (IST)', 'Other'];
export const AGES = Array.from({ length: 16 }, (_, i) => String(i + 3));
export const TEACHER_PREFS = ['No preference', 'Female teacher', 'Male teacher'];
export const MAX_CHILDREN = 10;
