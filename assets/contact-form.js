export function createContactPayload(formData, turnstileToken) {
  return {
    name: String(formData.get("name") || ""),
    phone: String(formData.get("phone") || ""),
    email: String(formData.get("email") || ""),
    message: String(formData.get("message") || ""),
    website: String(formData.get("website") || ""),
    turnstileToken,
  };
}

export async function loadContactConfig({ fetchImpl = fetch } = {}) {
  try {
    const response = await fetchImpl("/api/contact-config", {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const config = await response.json();
    if (!response.ok || typeof config?.siteKey !== "string" || !config.siteKey.trim()) {
      throw new Error("Invalid contact configuration");
    }
    return config;
  } catch {
    throw new Error("Contact form is unavailable here. Please use the email link to get in touch.");
  }
}

export async function submitContact(payload, { fetchImpl = fetch } = {}) {
  let response;
  try {
    response = await fetchImpl("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Message could not be sent. Please try again.");
  }

  if (response.status === 429) {
    throw new Error("Too many messages. Please wait 10 minutes and try again.");
  }

  let result;
  try {
    result = await response.json();
  } catch {
    result = {};
  }

  if (!response.ok) {
    throw new Error(result?.message || "Message could not be sent. Please try again.");
  }

  if (result?.ok !== true || typeof result.message !== "string" || !result.message.trim()) {
    throw new Error("Message could not be sent. Please try again.");
  }

  return result;
}

function waitForTurnstile() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      if (window.turnstile) {
        resolve(window.turnstile);
        return;
      }
      attempts += 1;
      if (attempts >= 100) {
        reject(new Error("Security check did not load."));
        return;
      }
      window.setTimeout(check, 100);
    };
    check();
  });
}

function setFormStatus(element, message, state = "") {
  element.textContent = message;
  element.classList.toggle("is-success", state === "success");
  element.classList.toggle("is-error", state === "error");
}

async function initializeContactForm() {
  const form = document.querySelector("#contact-form");
  if (!form) return;

  const submitButton = form.querySelector(".form-submit");
  const submitLabel = submitButton.querySelector("span");
  const status = form.querySelector("#contact-form-status");
  const widgetContainer = form.querySelector("#turnstile-widget");
  // Block native submission even when initialization fails or is still pending.
  form.addEventListener("submit", (event) => event.preventDefault());
  let turnstileToken = "";
  let widgetId;

  const disableSubmission = (message = "") => {
    turnstileToken = "";
    submitButton.disabled = true;
    if (message) setFormStatus(status, message, "error");
  };

  try {
    setFormStatus(status, "Loading security check…");
    const config = await loadContactConfig();
    const turnstile = await waitForTurnstile();

    widgetId = turnstile.render(widgetContainer, {
      sitekey: config.siteKey,
      action: "contact",
      theme:
        document.documentElement.getAttribute("data-theme") === "dark"
          ? "dark"
          : "light",
      callback(token) {
        turnstileToken = token;
        submitButton.disabled = false;
        setFormStatus(status, "Security check complete.", "success");
      },
      "expired-callback"() {
        disableSubmission("Security check expired. Please complete it again.");
      },
      "error-callback"() {
        disableSubmission("Security check failed to load. Please try again.");
      },
    });
  } catch (error) {
    disableSubmission(
      error instanceof Error
        ? error.message
        : "Contact form is temporarily unavailable.",
    );
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (!turnstileToken) {
      disableSubmission("Please complete the security check first.");
      return;
    }

    submitButton.disabled = true;
    form.setAttribute("aria-busy", "true");
    submitLabel.textContent = "Sending…";
    setFormStatus(status, "Sending your message…");

    try {
      const payload = createContactPayload(new FormData(form), turnstileToken);
      const result = await submitContact(payload);
      form.reset();
      setFormStatus(status, result.message, "success");
    } catch (error) {
      setFormStatus(
        status,
        error instanceof Error
          ? error.message
          : "Message could not be sent. Please try again.",
        "error",
      );
    } finally {
      turnstileToken = "";
      window.turnstile.reset(widgetId);
      submitButton.disabled = true;
      submitLabel.textContent = "Send Message";
      form.removeAttribute("aria-busy");
    }
  });
}

if (typeof document !== "undefined") {
  void initializeContactForm();
}
