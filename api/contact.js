import { validateContactInput } from "./_contact.js";

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const RESEND_EMAIL_URL = "https://api.resend.com/emails";
const MAX_REQUEST_BYTES = 16_384;
const PROVIDER_BUDGET_MS = 7_000;
const REQUIRED_ENVIRONMENT_VARIABLES = [
  "TURNSTILE_SECRET_KEY",
  "RESEND_API_KEY",
  "CONTACT_TO_EMAIL",
  "CONTACT_FROM_EMAIL",
];

function jsonResponse(body, status = 200, headers = {}) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...headers,
    },
  });
}

function getClientIp(request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "";
}

function buildEmailText(contact) {
  return [
    "New portfolio inquiry",
    "",
    `Name: ${contact.name}`,
    `Email: ${contact.email}`,
    `Phone: ${contact.phone || "Not provided"}`,
    "",
    "Project description:",
    contact.message,
  ].join("\n");
}

function hasServerConfiguration(env) {
  return REQUIRED_ENVIRONMENT_VARIABLES.every(
    (name) => typeof env[name] === "string" && env[name].trim(),
  );
}

function isTurnstileResponse(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.success === "boolean" &&
    (!value.success ||
      (typeof value.hostname === "string" && typeof value.action === "string"))
  );
}

async function readBoundedBody(request, maxBytes) {
  if (!request.body) return { ok: true, text: "" };

  const reader = request.body.getReader();
  const chunks = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        return { ok: false };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, text: new TextDecoder("utf-8", { fatal: true }).decode(body) };
}

export function createContactHandler({
  env,
  fetchImpl = fetch,
  now = Date.now,
  timeoutSignal = (milliseconds) => AbortSignal.timeout(milliseconds),
}) {
  return {
    async fetch(request) {
      if (request.method !== "POST") {
        return jsonResponse(
          { ok: false, message: "Method not allowed." },
          405,
          { allow: "POST" },
        );
      }

      if (!hasServerConfiguration(env)) {
        return jsonResponse(
          { ok: false, message: "Contact form is temporarily unavailable." },
          503,
        );
      }

      const contentType = request.headers.get("content-type") || "";
      const mediaType = contentType.split(";", 1)[0].trim().toLowerCase();
      if (mediaType !== "application/json") {
        return jsonResponse(
          { ok: false, message: "Please submit the form as JSON." },
          415,
        );
      }

      const declaredLength = Number(request.headers.get("content-length"));
      if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
        return jsonResponse(
          { ok: false, message: "Submission is too large." },
          413,
        );
      }

      let body;
      try {
        const boundedBody = await readBoundedBody(request, MAX_REQUEST_BYTES);
        if (!boundedBody.ok) {
          return jsonResponse(
            { ok: false, message: "Submission is too large." },
            413,
          );
        }
        body = JSON.parse(boundedBody.text);
      } catch {
        return jsonResponse(
          { ok: false, message: "Please check your details and try again." },
          400,
        );
      }

      const parsed = validateContactInput(body);
      if (!parsed.ok) {
        return jsonResponse(
          { ok: false, message: parsed.message },
          parsed.status,
        );
      }

      const providerDeadline = now() + PROVIDER_BUDGET_MS;
      const remainingProviderSignal = () =>
        timeoutSignal(Math.max(1, providerDeadline - now()));

      let verificationResponse;
      let verification;
      try {
        verificationResponse = await fetchImpl(TURNSTILE_VERIFY_URL, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            secret: env.TURNSTILE_SECRET_KEY,
            response: parsed.value.turnstileToken,
            remoteip: getClientIp(request),
          }),
          signal: remainingProviderSignal(),
        });
        verification = await verificationResponse.json();
      } catch {
        return jsonResponse(
          {
            ok: false,
            message: "Verification is temporarily unavailable. Please try again.",
          },
          503,
        );
      }
      if (!verificationResponse.ok || !isTurnstileResponse(verification)) {
        return jsonResponse(
          {
            ok: false,
            message: "Verification is temporarily unavailable. Please try again.",
          },
          503,
        );
      }
      const hostname = new URL(request.url).hostname;
      if (
        !verification.success ||
        verification.hostname !== hostname ||
        verification.action !== "contact"
      ) {
        return jsonResponse(
          { ok: false, message: "Verification failed. Please try again." },
          403,
        );
      }

      let emailResponse;
      try {
        emailResponse = await fetchImpl(RESEND_EMAIL_URL, {
          method: "POST",
          headers: {
            authorization: `Bearer ${env.RESEND_API_KEY}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            from: env.CONTACT_FROM_EMAIL,
            to: [env.CONTACT_TO_EMAIL],
            reply_to: parsed.value.email,
            subject: `Portfolio inquiry from ${parsed.value.name}`,
            text: buildEmailText(parsed.value),
          }),
          signal: remainingProviderSignal(),
        });
      } catch {
        return jsonResponse(
          { ok: false, message: "Message delivery failed. Please try again." },
          502,
        );
      }
      if (!emailResponse.ok) {
        return jsonResponse(
          { ok: false, message: "Message delivery failed. Please try again." },
          502,
        );
      }

      return jsonResponse({
        ok: true,
        message: "Thanks! Your message has been sent.",
      });
    },
  };
}

export default createContactHandler({ env: process.env });
