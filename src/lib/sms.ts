export function smsConfigured() {
  const env = process.env;
  switch (env.SMS_PROVIDER) {
    case 'console': return env.NODE_ENV === 'development';
    case 'kavenegar': return Boolean(env.KAVENEGAR_API_KEY && env.KAVENEGAR_OTP_TEMPLATE);
    case 'melipayamak': return Boolean(env.MELIPAYAMAK_USERNAME && env.MELIPAYAMAK_PASSWORD && env.MELIPAYAMAK_BODY_ID);
    case 'twilio': return Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && (env.TWILIO_FROM || env.TWILIO_MESSAGING_SERVICE_SID));
    case 'webhook': return Boolean(env.SMS_WEBHOOK_URL?.startsWith('https://') && env.SMS_WEBHOOK_TOKEN);
    default: return false;
  }
}

export async function sendPhoneCode(phone: string, code: string) {
  if (!smsConfigured()) throw new Error('SMS_NOT_CONFIGURED');
  const env = process.env;
  if (env.SMS_PROVIDER === 'console') {
    console.info(`[OTP:DEV] phone=${phone} code=${code} expires=5min`);
    return;
  }
  const text = `کد تأیید فرشا: ${code}\nاعتبار: ۵ دقیقه\nاین کد را در اختیار دیگران قرار ندهید.`;
  if (env.SMS_PROVIDER === 'twilio') {
    const body = new URLSearchParams({ To: phone, Body: text });
    if (env.TWILIO_MESSAGING_SERVICE_SID) body.set('MessagingServiceSid', env.TWILIO_MESSAGING_SERVICE_SID);
    else body.set('From', env.TWILIO_FROM!);
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(env.TWILIO_ACCOUNT_SID!)}/Messages.json`, {
      method: 'POST', body, cache: 'no-store', signal: AbortSignal.timeout(10_000),
      headers: { Authorization: `Basic ${Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64')}` },
    });
    const result = await response.json() as { sid?: string; error_code?: number; status?: string };
    if (!response.ok || !result.sid || result.error_code || ['failed', 'undelivered'].includes(result.status ?? '')) throw new Error('SMS_SEND_FAILED');
    return;
  }
  if (env.SMS_PROVIDER === 'melipayamak') {
    const response = await fetch('https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber', {
      method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(10_000),
      body: new URLSearchParams({ username: env.MELIPAYAMAK_USERNAME!, password: env.MELIPAYAMAK_PASSWORD!, bodyId: env.MELIPAYAMAK_BODY_ID!, text: code, to: phone.startsWith('+98') ? `0${phone.slice(3)}` : phone }),
    });
    const result = await response.json() as { RetStatus?: number; Value?: string };
    if (!response.ok || result.RetStatus !== 1 || !/^\d{6,}$/.test(String(result.Value))) throw new Error('SMS_SEND_FAILED');
    return;
  }
  if (env.SMS_PROVIDER === 'webhook') {
    // A server-owned HTTPS gateway can adapt any additional provider without changing OTP logic.
    const response = await fetch(env.SMS_WEBHOOK_URL!, {
      method: 'POST', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10_000),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.SMS_WEBHOOK_TOKEN}` },
      body: JSON.stringify({ phone, code, text, expiresInSeconds: 300 }),
    });
    const result = await response.json() as { accepted?: boolean };
    if (!response.ok || result.accepted !== true) throw new Error('SMS_SEND_FAILED');
    return;
  }
  // Never log this URL, the provider response, or the verification code.
  const response = await fetch(`https://api.kavenegar.com/v1/${encodeURIComponent(process.env.KAVENEGAR_API_KEY!)}/verify/lookup.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      receptor: phone.startsWith('+98') ? `0${phone.slice(3)}` : phone,
      token: code,
      template: process.env.KAVENEGAR_OTP_TEMPLATE!,
      type: 'sms',
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  });
  const result = await response.json() as { return?: { status?: number } };
  if (!response.ok || result.return?.status !== 200) throw new Error('SMS_SEND_FAILED');
}
