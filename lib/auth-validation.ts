export const DELETE_CONFIRMATION_PHRASE = "DELETE";

export function normalizeEmail(email: string) { return email.trim().toLowerCase(); }

export function validatePassword(password: string) {
  if (password.length < 8) return "Use at least 8 characters.";
  return null;
}

export function canDeleteAccount(password: string, confirmation: string) {
  return password.length >= 8 && confirmation.trim().toUpperCase() === DELETE_CONFIRMATION_PHRASE;
}
