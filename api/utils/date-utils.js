import { addDays, isWeekend } from 'date-fns';
import JapaneseHolidays from 'japanese-holidays';

/**
 * Ensures the given date is a business day (weekday and non-holiday in Japan).
 * If it falls on a weekend or holiday, it shifts to the NEXT business day.
 * 
 * @param {Date} date base date
 * @returns {Date} valid business date
 */
export function getNextBusinessDay(date) {
    let current = new Date(date.getTime());
    
    while (true) {
        // Is it weekend?
        if (isWeekend(current)) {
            current = addDays(current, 1);
            continue;
        }

        // Is it a public holiday?
        // Handle possible ESM/CJS import discrepancies
        const jh = JapaneseHolidays.default || JapaneseHolidays;
        const holiday = jh.isHoliday(current);
        if (holiday) {
            current = addDays(current, 1);
            continue;
        }

        // It is a weekday and not a public holiday -> Valid business day
        break;
    }

    return current;
}

/**
 * Gets the start and end dates for the current billing cycle (21st of previous month - 20th of current month)
 * Or calculates based on a specific target year/month
 */
export function getBillingCycleDates(targetDate = new Date()) {
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth(); // 0-indexed
    const day = targetDate.getDate();

    let startMonth = month - 1;
    let startYear = year;
    let targetBillingMonth = month;
    let targetBillingYear = year;

    // If we are generating *before* the 20th of the current month, 
    // it probably means we are closing the previous month's period early.
    // Usually, closing happens on or after the 21st.
    // For simplicity, let's say if day <= 20, we assume the user is trying to close the *previous* 21st to *current* 20th.
    // Wait, if it's the 21st of October, the cutoff was the 20th. So start = Sept 21, end = Oct 20.
    
    // So target closing date is always the 20th of the "current" target month.
    // Start date is 21st of the previous month.

    const startDate = new Date(startYear, startMonth, 21, 0, 0, 0);
    const endDate = new Date(targetBillingYear, targetBillingMonth, 20, 23, 59, 59);

    return { startDate, endDate };
}

/**
 * Calculates the payment due date: 10th of the NEXT month from the billing month.
 * If the 10th is weekend/holiday, next business day.
 */
export function calculateDueDate(billingEndDate) {
    const nextMonth = billingEndDate.getMonth() + 1;
    const year = billingEndDate.getFullYear();

    const baseDueDate = new Date(year, nextMonth, 10, 0, 0, 0);
    return getNextBusinessDay(baseDueDate);
}
