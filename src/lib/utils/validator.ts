export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function isValidCourseCode(code: string): boolean {
  return /^[A-Z0-9-]{3,12}$/i.test(code.trim());
}
