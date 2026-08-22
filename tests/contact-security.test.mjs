import assert from "node:assert/strict";
import test from "node:test";

import { validateContactInput } from "../api/_contact.js";
import { createContactHandler } from "../api/contact.js";
import { createTurnstileConfigHandler } from "../api/contact-config.js";
import { createContactPayload, submitContact } from "../assets/contact-form.js";

const VALID_SUBMISSION = {
  name: "Ada Lovelace",
  phone: "+44 20 7946 0958",
  email: "ada@example.com",
  message: "I would like help building an accessible project website.",
  website: "",
  turnstileToken: "valid-token",
};

const ENV = {
  TURNSTILE_SECRET_KEY: "turnstile-secret",
  RESEND_API_KEY: "resend-secret",
  CONTACT_TO_EMAIL: "owner@example.com",
  CONTACT_FROM_EMAIL: "Portfolio <portfolio@example.net>",
};

function contactRequest(overrides = {}) {
  return new Request("https://jrpbone.vercel.app/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(VALID_SUBMISSION),
    ...overrides,
  });
}

test("accepts a complete, human-looking contact submission", () => {
  const result = validateContactInput({
    name: "Ada Lovelace",
    phone: "+44 20 7946 0958",
    email: "ada@example.com",
    message: "I would like help building an accessible project website.",
    website: "",
    turnstileToken: "verified-by-the-handler",
  });

  assert.deepEqual(result, {
    ok: true,
    value: {
      name: "Ada Lovelace",
      phone: "+44 20 7946 0958",
      email: "ada@example.com",
      message: "I would like help building an accessible project website.",
      turnstileToken: "verified-by-the-handler",
    },
  });
});

test("silently rejects submissions that fill the honeypot", () => {
  const result = validateContactInput({
    name: "Spam Bot",
    phone: "",
    email: "bot@example.com",
    message: "This automated message should never reach the inbox.",
    website: "https://spam.example",
    turnstileToken: "fake-token",
  });

  assert.deepEqual(result, {
    ok: false,
    status: 400,
    code: "invalid_submission",
    message: "Please check your details and try again.",
  });
});

test("rejects missing, malformed, and oversized contact fields", async (t) => {
  const valid = {
    name: "Ada Lovelace",
    phone: "",
    email: "ada@example.com",
    message: "I would like help building an accessible project website.",
    website: "",
    turnstileToken: "valid-token",
  };
  const cases = [
    ["short name", { name: "A" }],
    ["long name", { name: "A".repeat(81) }],
    ["name with control characters", { name: "Ada\nBcc: victim@example.com" }],
    ["invalid phone", { phone: "call-me<script>" }],
    ["long phone", { phone: "1".repeat(31) }],
    ["invalid email", { email: "not-an-email" }],
    ["long email", { email: `${"a".repeat(245)}@example.com` }],
    ["short message", { message: "Too short" }],
    ["long message", { message: "A".repeat(3001) }],
    ["missing Turnstile token", { turnstileToken: "" }],
    ["non-string field", { message: 42 }],
    ["unexpected field", { role: "admin" }],
  ];

  for (const [name, change] of cases) {
    await t.test(name, () => {
      const result = validateContactInput({ ...valid, ...change });
      assert.equal(result.ok, false);
      assert.equal(result.status, 400);
      assert.equal(result.code, "invalid_submission");
    });
  }
});

test("delivers a contact email only after Turnstile verifies the request", async () => {
  const externalRequests = [];
  const fetchImpl = async (url, options) => {
    externalRequests.push({ url, options });
    if (url.includes("siteverify")) {
      return Response.json({
        success: true,
        challenge_ts: "2026-08-22T08:00:00.000Z",
        hostname: "jrpbone.vercel.app",
        "error-codes": [],
        action: "contact",
        cdata: "",
      });
    }
    return Response.json({ id: "email_123" });
  };
  const handler = createContactHandler({ env: ENV, fetchImpl });
  const response = await handler.fetch(
    new Request("https://jrpbone.vercel.app/api/contact", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "203.0.113.10",
      },
      body: JSON.stringify(VALID_SUBMISSION),
    }),
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    message: "Thanks! Your message has been sent.",
  });
  assert.equal(externalRequests.length, 2);

  const verificationBody = JSON.parse(externalRequests[0].options.body);
  assert.deepEqual(verificationBody, {
    secret: "turnstile-secret",
    response: "valid-token",
    remoteip: "203.0.113.10",
  });

  const emailBody = JSON.parse(externalRequests[1].options.body);
  assert.equal(emailBody.from, "Portfolio <portfolio@example.net>");
  assert.deepEqual(emailBody.to, ["owner@example.com"]);
  assert.equal(emailBody.reply_to, "ada@example.com");
  assert.match(emailBody.text, /Ada Lovelace/);
  assert.match(emailBody.text, /accessible project website/);
});

test("shares one bounded deadline across verification and email delivery", async () => {
  let currentTime = 1_000;
  const requestedTimeouts = [];
  let requestCount = 0;
  const handler = createContactHandler({
    env: ENV,
    now: () => currentTime,
    timeoutSignal(milliseconds) {
      requestedTimeouts.push(milliseconds);
      return { milliseconds };
    },
    fetchImpl: async () => {
      requestCount += 1;
      if (requestCount === 1) {
        currentTime += 6_000;
        return Response.json({
          success: true,
          challenge_ts: "2026-08-22T08:00:00.000Z",
          hostname: "jrpbone.vercel.app",
          "error-codes": [],
          action: "contact",
          cdata: "",
        });
      }
      return Response.json({ id: "email_123" });
    },
  });

  const response = await handler.fetch(contactRequest());

  assert.equal(response.status, 200);
  assert.deepEqual(requestedTimeouts, [7_000, 1_000]);
});

test("rejects unsupported request methods before reading the body", async () => {
  const handler = createContactHandler({
    env: ENV,
    fetchImpl: () => {
      throw new Error("External services must not be called");
    },
  });
  const response = await handler.fetch(
    new Request("https://jrpbone.vercel.app/api/contact", { method: "GET" }),
  );

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "POST");
});

test("fails closed when server credentials are missing", async () => {
  const handler = createContactHandler({
    env: {},
    fetchImpl: () => {
      throw new Error("External services must not be called");
    },
  });
  const response = await handler.fetch(contactRequest());

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    ok: false,
    message: "Contact form is temporarily unavailable.",
  });
});

test("rejects non-JSON and oversized request bodies", async (t) => {
  const handler = createContactHandler({
    env: ENV,
    fetchImpl: () => {
      throw new Error("External services must not be called");
    },
  });

  await t.test("non-JSON content", async () => {
    const response = await handler.fetch(
      new Request("https://jrpbone.vercel.app/api/contact", {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: JSON.stringify(VALID_SUBMISSION),
      }),
    );
    assert.equal(response.status, 415);
  });

  await t.test("JSON-like but invalid media type", async () => {
    const response = await handler.fetch(
      new Request("https://jrpbone.vercel.app/api/contact", {
        method: "POST",
        headers: { "content-type": "application/jsonp" },
        body: JSON.stringify(VALID_SUBMISSION),
      }),
    );
    assert.equal(response.status, 415);
  });

  await t.test("oversized content", async () => {
    const response = await handler.fetch(
      contactRequest({
        headers: {
          "content-type": "application/json",
          "content-length": "20000",
        },
      }),
    );
    assert.equal(response.status, 413);
  });

  await t.test("streamed oversized content is cancelled early", async () => {
    let pulls = 0;
    const body = new ReadableStream({
      pull(controller) {
        pulls += 1;
        if (pulls <= 100) {
          controller.enqueue(new Uint8Array(1024));
        } else {
          controller.close();
        }
      },
    });
    const response = await handler.fetch(
      new Request("https://jrpbone.vercel.app/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        duplex: "half",
      }),
    );

    assert.equal(response.status, 413);
    assert.ok(pulls <= 18, `expected an early stream cancel, got ${pulls} pulls`);
  });
});

test("returns a validation response for malformed JSON", async () => {
  const handler = createContactHandler({
    env: ENV,
    fetchImpl: () => {
      throw new Error("External services must not be called");
    },
  });
  const response = await handler.fetch(
    new Request("https://jrpbone.vercel.app/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not-json",
    }),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    ok: false,
    message: "Please check your details and try again.",
  });
});

test("does not deliver email when Turnstile rejects the token", async () => {
  const externalRequests = [];
  const handler = createContactHandler({
    env: ENV,
    fetchImpl: async (url, options) => {
      externalRequests.push({ url, options });
      return Response.json({
        success: false,
        challenge_ts: "2026-08-22T08:00:00.000Z",
        hostname: "jrpbone.vercel.app",
        "error-codes": ["timeout-or-duplicate"],
        action: "contact",
        cdata: "",
      });
    },
  });
  const response = await handler.fetch(contactRequest());

  assert.equal(response.status, 403);
  assert.equal(externalRequests.length, 1);
});

test("does not deliver email for an invalid Turnstile token", async () => {
  const externalRequests = [];
  const handler = createContactHandler({
    env: ENV,
    fetchImpl: async (url, options) => {
      externalRequests.push({ url, options });
      return Response.json({
        success: false,
        challenge_ts: "2026-08-22T08:00:00.000Z",
        hostname: "jrpbone.vercel.app",
        "error-codes": ["invalid-input-response"],
        action: "contact",
        cdata: "",
      });
    },
  });
  const response = await handler.fetch(contactRequest());

  assert.equal(response.status, 403);
  assert.equal(externalRequests.length, 1);
});

test("does not deliver email when the Turnstile action is wrong", async () => {
  const externalRequests = [];
  const handler = createContactHandler({
    env: ENV,
    fetchImpl: async (url, options) => {
      externalRequests.push({ url, options });
      return Response.json({
        success: true,
        challenge_ts: "2026-08-22T08:00:00.000Z",
        hostname: "jrpbone.vercel.app",
        "error-codes": [],
        action: "login",
        cdata: "",
      });
    },
  });
  const response = await handler.fetch(contactRequest());

  assert.equal(response.status, 403);
  assert.equal(externalRequests.length, 1);
});

test("handles a malformed successful response from Siteverify", async () => {
  const handler = createContactHandler({
    env: ENV,
    fetchImpl: async () => Response.json(null),
  });
  const response = await handler.fetch(contactRequest());

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    ok: false,
    message: "Verification is temporarily unavailable. Please try again.",
  });
});

test("rejects a valid Turnstile token issued for another hostname", async () => {
  const handler = createContactHandler({
    env: ENV,
    fetchImpl: async () =>
      Response.json({
        success: true,
        challenge_ts: "2026-08-22T08:00:00.000Z",
        hostname: "attacker.example",
        "error-codes": [],
        action: "contact",
        cdata: "",
      }),
  });
  const response = await handler.fetch(contactRequest());

  assert.equal(response.status, 403);
});

test("returns a retryable response when verification is unavailable", async () => {
  const handler = createContactHandler({
    env: ENV,
    fetchImpl: async () => {
      throw new Error("network unavailable");
    },
  });
  const response = await handler.fetch(contactRequest());

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    ok: false,
    message: "Verification is temporarily unavailable. Please try again.",
  });
});

test("returns an error when the verified email cannot be delivered", async () => {
  let requestCount = 0;
  const handler = createContactHandler({
    env: ENV,
    fetchImpl: async () => {
      requestCount += 1;
      if (requestCount === 1) {
        return Response.json({
          success: true,
          challenge_ts: "2026-08-22T08:00:00.000Z",
          hostname: "jrpbone.vercel.app",
          "error-codes": [],
          action: "contact",
          cdata: "",
        });
      }
      return Response.json({ message: "provider unavailable" }, { status: 503 });
    },
  });
  const response = await handler.fetch(contactRequest());

  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), {
    ok: false,
    message: "Message delivery failed. Please try again.",
  });
});

test("exposes only the public Turnstile site key to the browser", async () => {
  const handler = createTurnstileConfigHandler({
    env: {
      TURNSTILE_SITE_KEY: "public-site-key",
      TURNSTILE_SECRET_KEY: "must-not-leak",
    },
  });
  const response = await handler.fetch(
    new Request("https://jrpbone.vercel.app/api/contact-config"),
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { siteKey: "public-site-key" });
});

test("fails closed when the public Turnstile site key is not configured", async () => {
  const handler = createTurnstileConfigHandler({ env: {} });
  const response = await handler.fetch(
    new Request("https://jrpbone.vercel.app/api/contact-config"),
  );

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    message: "Contact form is temporarily unavailable.",
  });
});

test("submits contact details to the protected same-origin endpoint", async () => {
  let receivedRequest;
  const fetchImpl = async (url, options) => {
    receivedRequest = { url, options };
    return Response.json({
      ok: true,
      message: "Thanks! Your message has been sent.",
    });
  };

  const result = await submitContact(VALID_SUBMISSION, { fetchImpl });

  assert.deepEqual(result, {
    ok: true,
    message: "Thanks! Your message has been sent.",
  });
  assert.equal(receivedRequest.url, "/api/contact");
  assert.equal(receivedRequest.options.method, "POST");
  assert.equal(receivedRequest.options.headers["content-type"], "application/json");
  assert.deepEqual(JSON.parse(receivedRequest.options.body), VALID_SUBMISSION);
});

test("builds the protected payload from form fields and the Turnstile token", () => {
  const values = new Map([
    ["name", "Ada Lovelace"],
    ["phone", "+44 20 7946 0958"],
    ["email", "ada@example.com"],
    ["message", "I would like help building an accessible project website."],
    ["website", ""],
  ]);

  assert.deepEqual(createContactPayload(values, "turnstile-token"), {
    name: "Ada Lovelace",
    phone: "+44 20 7946 0958",
    email: "ada@example.com",
    message: "I would like help building an accessible project website.",
    website: "",
    turnstileToken: "turnstile-token",
  });
});

test("surfaces the server's safe error message to the contact form", async () => {
  const fetchImpl = async () =>
    Response.json(
      { ok: false, message: "Verification failed. Please try again." },
      { status: 403 },
    );

  await assert.rejects(
    () => submitContact(VALID_SUBMISSION, { fetchImpl }),
    /Verification failed\. Please try again\./,
  );
});

test("maps a firewall rate limit response to a clear cooldown message", async () => {
  const fetchImpl = async () =>
    new Response("Too Many Requests", {
      status: 429,
      headers: { "content-type": "text/plain" },
    });

  await assert.rejects(
    () => submitContact(VALID_SUBMISSION, { fetchImpl }),
    (error) => {
      assert.equal(
        error.message,
        "Too many messages. Please wait 10 minutes and try again.",
      );
      return true;
    },
  );
});

test("maps unexpected browser network failures to a safe message", async () => {
  const fetchImpl = async () => {
    throw new Error("internal browser network details");
  };

  await assert.rejects(
    () => submitContact(VALID_SUBMISSION, { fetchImpl }),
    (error) => {
      assert.equal(error.message, "Message could not be sent. Please try again.");
      return true;
    },
  );
});
