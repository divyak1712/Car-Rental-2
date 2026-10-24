import type { APIRequestContext } from '@playwright/test';

export function uniqueEmail(prefix = 'e2e'): string {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1e6)}@playwright-tests.dev`;
}

// Date (YYYY-MM-DD) `offsetDays` from today, UTC.
export function dateOffset(offsetDays: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/**
 * Day offset (from today) for a range that is free on `carId`: each spec uses its own car and
 * a distinct base offset, and starts one day after the latest existing booking on that car, so
 * repeated runs against the persistent test DB never overlap earlier runs' bookings.
 * Serial execution (workers: 1) makes read-then-book safe.
 */
export async function nextFreeOffset(request: APIRequestContext, carId: number, base: number): Promise<number> {
  const res = await request.get(`/api/availability/${carId}`);
  const ranges: { endsAt: string }[] = await res.json();
  const today = Date.parse(dateOffset(0));
  let offset = base;
  for (const r of ranges) {
    const endOffset = Math.ceil((Date.parse(r.endsAt.slice(0, 10)) - today) / 86_400_000);
    offset = Math.max(offset, endOffset + 1);
  }
  return offset;
}

export const ADMIN = { email: 'admin@carrental.dev', password: 'admin123' };
export const PASSWORD = 'Passw0rd!e2e';
