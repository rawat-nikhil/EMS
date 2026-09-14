const REFUSAL = "I can't share email or password.";

const PASSWORD_DUMP = /\bpassword(hash)?\s*[:=]\s*\S+/i;

export function applyOutputGuardrail(reply: string, email: string | undefined): string {
  const looksLikePasswordDump = PASSWORD_DUMP.test(reply);
  const leakedEmail = Boolean(email && reply.toLowerCase().includes(email.toLowerCase()));
  if (looksLikePasswordDump || leakedEmail) {
    return REFUSAL;
  }
  return reply;
}
