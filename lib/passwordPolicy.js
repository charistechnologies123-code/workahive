export const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const passwordErrorMessage =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";