/*
  Password policy — mirrors ../hive-api/app/domain/passwords.py (the server is the
  authority; this drives the live meter so people see problems before submitting).
*/

export const PASSWORD_MIN = 8;
const MAX_BYTES = 72;

const COMMON = new Set([
  "password", "password1", "password12", "password123", "passw0rd", "p@ssw0rd",
  "12345678", "123456789", "1234567890", "0123456789", "87654321", "11111111",
  "00000000", "12341234", "11223344", "123123123", "qwertyui", "qwerty123",
  "qwertyuiop", "1q2w3e4r", "1qaz2wsx", "zaq12wsx", "asdfghjk", "asdfasdf",
  "abcd1234", "abcdefgh", "iloveyou", "sunshine", "princess", "football",
  "baseball", "welcome1", "welcome123", "letmein1", "trustno1", "superman",
  "starwars", "whatever", "computer", "internet", "michael1", "jennifer",
  "dragon12", "monkey12", "shadow12", "master12", "admin123", "administrator",
  "changeme", "default1", "secret12", "secret123", "test1234", "testtest",
  "india123", "india@123", "bharat123", "mumbai123", "delhi123",
  "hive1234", "hivehive", "flatmate", "roommate",
]);

export type PasswordCheck = { label: string; ok: boolean };

/** The rules the server enforces, each with pass/fail — rendered as a checklist. */
export function passwordChecks(password: string, username?: string): PasswordCheck[] {
  const lower = password.toLowerCase();
  const name = (username ?? "").trim().toLowerCase();
  return [
    { label: `At least ${PASSWORD_MIN} characters`, ok: password.length >= PASSWORD_MIN },
    {
      label: "Not a common or repeated password",
      ok: password.length > 0 && !COMMON.has(lower) && new Set(password).size > 1,
    },
    { label: "Doesn't contain your username", ok: !(name.length >= 3 && lower.includes(name)) },
    { label: "Not absurdly long", ok: new TextEncoder().encode(password).length <= MAX_BYTES },
  ];
}

export function passwordAcceptable(password: string, username?: string): boolean {
  return passwordChecks(password, username).every((c) => c.ok);
}

/** 0–4 strength for the meter — rules first, then length and variety on top. */
export function passwordScore(password: string, username?: string): number {
  if (!password) return 0;
  if (!passwordAcceptable(password, username)) return 1;
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length;
  let score = 2;
  if (password.length >= 12 || classes >= 3) score++;
  if (password.length >= 16 && classes >= 2) score++;
  return Math.min(score, 4);
}

export const SCORE_LABELS = ["", "Too weak", "Okay", "Strong", "Very strong"] as const;
