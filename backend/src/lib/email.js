import { Resend } from 'resend';

let resendClient = null;

function getResend() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  if (!resendClient) resendClient = new Resend(key);
  return resendClient;
}

export async function sendVerificationEmail({ to, name, code }) {
  const from = process.env.RESEND_FROM?.trim() || 'AdvCargo <onboarding@resend.dev>';
  const subject = 'Seu código de verificação - AdvCargo';
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1e293b;">
      <h2 style="color: #0f172a;">AdvCargo</h2>
      <p>Olá, ${name}!</p>
      <p>Use o código abaixo para confirmar seu cadastro:</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 16px; background: #f1f5f9; border-radius: 8px;">${code}</p>
      <p style="color: #64748b; font-size: 14px;">Este código expira em 15 minutos. Se você não solicitou o cadastro, ignore este e-mail.</p>
    </div>
  `;

  const client = getResend();
  if (!client) {
    console.log(`[email] RESEND_API_KEY ausente — código para ${to}: ${code}`);
    return { dev: true };
  }

  const { data, error } = await client.emails.send({ from, to, subject, html });
  if (error) throw new Error(error.message || 'Falha ao enviar e-mail');
  return data;
}
