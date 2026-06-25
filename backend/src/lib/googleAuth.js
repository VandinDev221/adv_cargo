import { OAuth2Client } from 'google-auth-library';

let client;

function getClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return null;
  if (!client) client = new OAuth2Client(clientId);
  return client;
}

export function isGoogleAuthEnabled() {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim());
}

/** Valida o ID token do Google e retorna o payload (sub, email, name, ...). */
export async function verifyGoogleIdToken(idToken) {
  const oauth = getClient();
  if (!oauth) {
    throw new Error('Login com Google não configurado no servidor');
  }

  const ticket = await oauth.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw new Error('Token Google inválido');
  }
  if (payload.email_verified === false) {
    throw new Error('E-mail Google não verificado');
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase().trim(),
    name: (payload.name || payload.email.split('@')[0]).trim(),
    picture: payload.picture || null,
  };
}
