/**
 * Featherless AI integration for Lunaris — the "Ask Lunaris" feature.
 * -----------------------------------------------------------------------
 * WHAT THIS FILE DOES
 * Sends a student's question, plus the specific opportunities Lunaris's
 * OWN matching/search logic already picked out, to a Featherless-hosted
 * language model, and asks it to explain those opportunities in plain
 * language. It never asks the model to invent scholarships or eligibility
 * facts — it's only allowed to talk about the data it's handed.
 *
 * Featherless exposes an OpenAI-compatible Chat Completions API, so this
 * is a plain fetch() call — no SDK required.
 * Docs: https://featherless.ai/docs/quickstart-guide
 *
 * SECURITY NOTE (read this before a real launch, fine for a hackathon demo)
 * This calls Featherless directly from the browser using the API key from
 * VITE_FEATHERLESS_API_KEY. Any key exposed to `import.meta.env` in a Vite
 * app is bundled into the JavaScript that ships to the browser — meaning
 * someone could find it in your site's network requests / source if they
 * went looking. That's a common, accepted shortcut for a hackathon demo.
 * For a real product with real users, this call should instead go through
 * a small server/serverless function that holds the key, so the browser
 * never sees it. See FEATHERLESS_SETUP.md for how to do that later if
 * you need to.
 */

const FEATHERLESS_API_URL = "https://api.featherless.ai/v1/chat/completions";

// Cap how many opportunities we ever hand to the model in one go. Lunaris's
// own matching/search logic has already done the hard work of narrowing
// the 54-item dataset down — this just keeps the prompt small and the
// response fast for a live demo, even if a broad/unfiltered list is passed in.
export const MAX_CONTEXT_OPPORTUNITIES = 8;

// A small, fast, widely-available instruct model — a reasonable starting
// default for a live demo. This is NOT guaranteed to be on your specific
// Featherless plan. Two ways to confirm/change it, with ZERO code edits:
//   1. Add VITE_FEATHERLESS_MODEL=... to your .env file to override it, or
//   2. Check https://featherless.ai/models (or GET /v1/models with your
//      key) for a model your plan actually includes, then set it via #1.
const DEFAULT_MODEL = "Qwen/Qwen2.5-7B-Instruct";

const SYSTEM_PROMPT = `You are the AI assistant for Lunaris, a scholarship discovery platform.
Only use the scholarship information provided in this prompt. Never invent
scholarships, eligibility requirements, deadlines, benefits, documents, or
other facts. If the provided data is insufficient to answer the question,
say so clearly instead of guessing.
Write in clear, simple, encouraging language a student can easily
understand. Keep your answer focused — a short paragraph, or a few short
bullet points, not an essay. When you mention a scheme, use its real name
exactly as given below.`;

function formatOpportunityForPrompt(opp) {
  const elig = opp.eligibility || {};
  const lines = [
    `Name: ${opp.name}`,
    `Category: ${opp.category}`,
    `Provider: ${opp.provider}`,
    `Description: ${opp.description}`,
    `Eligibility — education: ${(elig.education || []).join("/") || "not specified"}; applicant category: ${
      (elig.category || []).join("/") || "not specified"
    }; gender: ${elig.gender || "All"}; age: ${elig.minAge ?? "no minimum"}–${elig.maxAge ?? "no maximum"}; family income limit: ${
      elig.incomeLimit != null ? `up to ₹${elig.incomeLimit.toLocaleString("en-IN")}/year` : "no specific limit"
    }`,
    `Benefits: ${opp.benefits}`,
    `Official source: ${opp.applicationUrl}`,
  ];
  return lines.join("\n");
}

function buildUserMessage({ question, opportunities, profile }) {
  const trimmed = (opportunities || []).slice(0, MAX_CONTEXT_OPPORTUNITIES);
  const dataBlock = trimmed
    .map((opp, i) => `Scholarship/Scheme ${i + 1}:\n${formatOpportunityForPrompt(opp)}`)
    .join("\n\n");

  const profileBlock = profile
    ? `\nThe student's profile, already collected by Lunaris:\n${JSON.stringify(profile, null, 2)}\n`
    : "";

  return `Student's question: "${question}"
${profileBlock}
Here are the opportunities Lunaris's own matching system has already identified as relevant (use ONLY these — do not mention any scholarship not listed here):

${dataBlock || "(No opportunities were provided — say you don't have enough information to answer.)"}

Now answer the student's question using only the information above.`;
}

/**
 * Ask Featherless to explain the given opportunities in response to a
 * student's question. Throws a plain Error with a beginner-readable
 * message on any failure — the calling component is expected to catch
 * it and show `error.message` to the user.
 */
export async function askLunaris({ question, opportunities, profile }) {
  const apiKey = import.meta.env.VITE_FEATHERLESS_API_KEY;
  const model = import.meta.env.VITE_FEATHERLESS_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    throw new Error(
      "Featherless API key not found. Add VITE_FEATHERLESS_API_KEY to your .env file, then restart `npm run dev`."
    );
  }
  if (!question || !question.trim()) {
    throw new Error("Please type a question first.");
  }
  if (!opportunities || opportunities.length === 0) {
    throw new Error("There are no opportunities to ask about yet — search or fill in your profile first.");
  }

  const requestBody = {
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserMessage({ question, opportunities, profile }) },
    ],
    temperature: 0.4,
    max_tokens: 500,
  };

  let response;
  try {
    response = await fetch(FEATHERLESS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        // Identifies Lunaris as the calling app in Featherless's own
        // request logs/analytics — useful proof-of-integration for judges.
        "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "https://lunaris.app",
        "X-Title": "Lunaris",
      },
      body: JSON.stringify(requestBody),
    });
  } catch (networkError) {
    // fetch() only throws like this for network-level failures. In a
    // browser, this almost always means the request was blocked before
    // it ever reached Featherless — most commonly CORS. See
    // FEATHERLESS_SETUP.md → "If Ask Lunaris shows a connection error".
    throw new Error(
      "Could not reach Featherless from the browser (a network/CORS error, not a Featherless error). See FEATHERLESS_SETUP.md for what to do next."
    );
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Featherless rejected the API key (401 Unauthorized). Double-check VITE_FEATHERLESS_API_KEY in .env.");
    }
    if (response.status === 404) {
      throw new Error(
        `Featherless couldn't find the model "${model}" (404). Check VITE_FEATHERLESS_MODEL in .env, or your available models at featherless.ai/models.`
      );
    }
    if (response.status === 429) {
      throw new Error("Featherless rate limit reached (429). Wait a few seconds and try again.");
    }
    let detail = "";
    try {
      const errJson = await response.json();
      detail = errJson?.error?.message || JSON.stringify(errJson);
    } catch {
      detail = `HTTP ${response.status}`;
    }
    throw new Error(`Featherless returned an error: ${detail}`);
  }

  const data = await response.json();
  const answer = data?.choices?.[0]?.message?.content?.trim();
  if (!answer) {
    throw new Error("Featherless returned an empty response. Please try asking again.");
  }
  return answer;
}
