// Cognito auth (SRP) — no Hosted UI redirect; the app's own forms drive it.
// Tokens live in localStorage (amazon-cognito-identity-js default) and survive reloads.
// api.ts sends the ID token as `Authorization: Bearer`; the API Gateway JWT
// authorizer validates it (aud = this client id, which is in the pool's audience list).
import {
  CognitoUserPool,
  CognitoUser,
  CognitoUserAttribute,
  AuthenticationDetails,
  type CognitoUserSession,
} from "amazon-cognito-identity-js";

// Lazily built so a missing .env never throws at import time and blanks the app.
let _pool: CognitoUserPool | null = null;
function getPool(): CognitoUserPool {
  if (_pool) return _pool;
  const UserPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
  const ClientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
  if (!UserPoolId || !ClientId) {
    throw new Error(
      "Cognito yapılandırması eksik. frontend/.env dosyasında VITE_COGNITO_USER_POOL_ID ve VITE_COGNITO_CLIENT_ID tanımlı olmalı, sonra dev server'ı yeniden başlat.",
    );
  }
  _pool = new CognitoUserPool({ UserPoolId, ClientId });
  return _pool;
}

export interface SessionUser {
  sub: string;
  email: string;
}

// --- Cognito error -> friendly Turkish message (keeps .code for flow control) ---
const MESSAGES: Record<string, string> = {
  UsernameExistsException: "Bu e-posta ile zaten bir hesap var.",
  NotAuthorizedException: "E-posta veya şifre hatalı.",
  UserNotFoundException: "E-posta veya şifre hatalı.",
  UserNotConfirmedException: "Hesabın henüz doğrulanmadı. E-postana gönderilen kodu gir.",
  CodeMismatchException: "Doğrulama kodu hatalı.",
  ExpiredCodeException: "Kodun süresi doldu. Yeni kod iste.",
  InvalidPasswordException: "Şifre en az 8 karakter olmalı; büyük harf, küçük harf ve rakam içermeli.",
  InvalidParameterException: "Bilgileri kontrol et.",
  LimitExceededException: "Çok fazla deneme yaptın. Biraz sonra tekrar dene.",
  TooManyRequestsException: "Çok fazla istek. Biraz sonra tekrar dene.",
};

function normalize(err: unknown): Error {
  const raw = err as { code?: string; name?: string; message?: string };
  const code = raw?.code || raw?.name || "";
  const e = new Error(MESSAGES[code] || raw?.message || "Bir hata oluştu.");
  (e as Error & { code?: string }).code = code;
  return e;
}

// --- Sign up (username = email, as configured on the pool) ---
export function signUp(email: string, password: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const attrs = [new CognitoUserAttribute({ Name: "email", Value: email })];
    getPool().signUp(email, password, attrs, [], (err) => {
      if (err) return reject(normalize(err));
      resolve();
    });
  });
}

// --- Confirm sign up with the emailed code ---
export function confirmSignUp(email: string, code: string): Promise<void> {
  return new Promise((resolve, reject) => {
    new CognitoUser({ Username: email, Pool: getPool() }).confirmRegistration(code, true, (err) => {
      if (err) return reject(normalize(err));
      resolve();
    });
  });
}

// --- Resend the confirmation code ---
export function resendCode(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    new CognitoUser({ Username: email, Pool: getPool() }).resendConfirmationCode((err) => {
      if (err) return reject(normalize(err));
      resolve();
    });
  });
}

// --- Sign in (SRP) ---
export function signIn(email: string, password: string): Promise<CognitoUserSession> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: getPool() });
    const details = new AuthenticationDetails({ Username: email, Password: password });
    user.authenticateUser(details, {
      onSuccess: (session) => resolve(session),
      onFailure: (err) => reject(normalize(err)),
    });
  });
}

// --- Current session (auto-refreshes via the refresh token if expired) ---
export function currentSession(): Promise<CognitoUserSession | null> {
  return new Promise((resolve) => {
    const user = getPool().getCurrentUser();
    if (!user) return resolve(null);
    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session || !session.isValid()) return resolve(null);
      resolve(session);
    });
  });
}

export function userInfo(session: CognitoUserSession): SessionUser {
  const payload = session.getIdToken().decodePayload();
  return { sub: String(payload.sub), email: String(payload.email ?? "") };
}

// --- ID token for the Authorization header (refreshed on demand) ---
export async function getIdToken(): Promise<string | null> {
  const session = await currentSession();
  return session ? session.getIdToken().getJwtToken() : null;
}

export function signOut(): void {
  getPool().getCurrentUser()?.signOut();
}
