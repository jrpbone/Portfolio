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

export function createTurnstileConfigHandler({ env }) {
  return {
    async fetch(request) {
      if (request.method !== "GET") {
        return jsonResponse({ message: "Method not allowed." }, 405, {
          allow: "GET",
        });
      }

      if (
        typeof env.TURNSTILE_SITE_KEY !== "string" ||
        !env.TURNSTILE_SITE_KEY.trim()
      ) {
        return jsonResponse(
          { message: "Contact form is temporarily unavailable." },
          503,
        );
      }

      return jsonResponse({ siteKey: env.TURNSTILE_SITE_KEY.trim() });
    },
  };
}

export default createTurnstileConfigHandler({ env: process.env });
