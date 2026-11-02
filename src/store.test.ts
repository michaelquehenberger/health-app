import { describe, expect, it } from 'vitest';
import { addDaysIso, calendarIcs } from './store';

describe('Kalenderdatei', () => {
  it('ganztägige Termine im ICS-Format', () => {
    const ics = calendarIcs([{ date: '2026-12-02', title: 'LIVION: Tag 30 messen', description: 'Ruhepuls, Testtag' }], new Date('2026-11-02T08:00:00Z'));
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('DTSTART;VALUE=DATE:20261202');
    expect(ics).toContain('DTEND;VALUE=DATE:20261203');
    expect(ics).toContain('SUMMARY:LIVION: Tag 30 messen');
    expect(ics).toContain('DESCRIPTION:Ruhepuls\\, Testtag');
    expect(ics.split('\r\n').at(-1)).toBe('END:VCALENDAR');
  });
  it('Tage addieren über Monatsgrenzen', () => {
    expect(addDaysIso('2026-11-02', 30)).toBe('2026-12-02');
    expect(addDaysIso('2026-11-02', 90)).toBe('2027-01-31');
  });
});
