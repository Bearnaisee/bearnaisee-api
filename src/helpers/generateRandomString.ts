/**
 * @summary Generate random string
 */
export function generateRandomString(): string {
  return ((Math.random() + 3 * Number.MIN_VALUE) / Math.PI).toString(36).slice(-8);
}
