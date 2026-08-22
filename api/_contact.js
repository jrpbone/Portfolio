const INVALID_SUBMISSION = Object.freeze({
  ok: false,
  status: 400,
  code: "invalid_submission",
  message: "Please check your details and try again.",
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+().\- \t]*$/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

export function validateContactInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return INVALID_SUBMISSION;
  }

  const fieldNames = [
    "name",
    "phone",
    "email",
    "message",
    "website",
    "turnstileToken",
  ];
  const inputFields = Object.keys(input);
  if (
    inputFields.length !== fieldNames.length ||
    inputFields.some((field) => !fieldNames.includes(field)) ||
    fieldNames.some((field) => typeof input[field] !== "string")
  ) {
    return INVALID_SUBMISSION;
  }

  const name = input.name.trim();
  const phone = input.phone.trim();
  const email = input.email.trim();
  const message = input.message.trim();
  const website = input.website.trim();
  const turnstileToken = input.turnstileToken.trim();

  if (
    website ||
    name.length < 2 ||
    name.length > 80 ||
    CONTROL_CHARACTER_PATTERN.test(name) ||
    phone.length > 30 ||
    !PHONE_PATTERN.test(phone) ||
    email.length > 254 ||
    !EMAIL_PATTERN.test(email) ||
    message.length < 20 ||
    message.length > 3000 ||
    !turnstileToken ||
    turnstileToken.length > 2048
  ) {
    return INVALID_SUBMISSION;
  }

  return {
    ok: true,
    value: {
      name,
      phone,
      email,
      message,
      turnstileToken,
    },
  };
}
