import type { AppointmentStatus, Availability, ClosureKind, VisitorAppointment, Weekday } from '../../types/appointments';

type Translate = (key: string, fallback?: string) => string;

/** Date of an instant in the organization's time zone, e.g. "Monday, 19 October 2026". */
export function zonedDate(instant: string, timeZone: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone }).format(new Date(instant));
  } catch {
    return new Intl.DateTimeFormat('en', { dateStyle: 'full', timeZone }).format(new Date(instant));
  }
}

/** A local calendar date ("2026-10-19") as a readable date, without shifting it through the browser's time zone. */
export function calendarDate(date: string, locale: string, options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }): string {
  const [year, month, day] = date.split('-').map(Number);
  const value = new Date(Date.UTC(year, month - 1, day, 12));
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(value);
  } catch {
    return date;
  }
}

export const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  BOOKED: 'Booked',
  CANCELLED: 'Cancelled',
  ATTENDED: 'Attended',
  NO_SHOW: 'Did not come',
};

export function appointmentStatusText(appointment: Pick<VisitorAppointment, 'status' | 'cancelledBy'>, t: Translate): string {
  if (appointment.status === 'CANCELLED' && appointment.cancelledBy === 'STAFF') {
    return t('appointments.status.cancelledByOrganization', 'Cancelled by the organization');
  }
  return t(`appointments.status.${appointment.status}`, appointmentStatusLabels[appointment.status]);
}

export const weekdayLabels: Record<Weekday, string> = {
  MONDAY: 'Monday', TUESDAY: 'Tuesday', WEDNESDAY: 'Wednesday', THURSDAY: 'Thursday', FRIDAY: 'Friday', SATURDAY: 'Saturday', SUNDAY: 'Sunday',
};

export const closureKindLabels: Record<ClosureKind, string> = { HOLIDAY: 'Holiday', CLOSED: 'Closed', UNAVAILABLE: 'Unavailable period' };

/** Next query start after the shown days, if the booking window continues. */
export function laterFrom(availability: Availability | undefined): string | undefined {
  const last = availability?.days.at(-1)?.date;
  if (!last || !availability?.lastBookableDate || last >= availability.lastBookableDate) return undefined;
  const [year, month, day] = last.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}
