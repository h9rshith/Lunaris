# Ask Lunaris — Featherless AI Setup Guide

This explains the new "Ask Lunaris" feature: what it is, how to run it,
how to test it, and what to say to judges.

## What was added

- **1 new file:** `src/utils/featherless.js` — the only place that talks to
  Featherless. It builds a prompt from a question + a list of opportunities
  (and an optional profile), sends it to Featherless's chat API, and
  returns the generated answer (or throws a friendly error).
- **1 small new component inside `Lunaris.jsx`:** `AskLunarisPanel` — a
  text box + button + answer display, styled to match the existing site.
- **2 mount points**, both just one new line each: on `DiscoveryPage` and
  on `PersonalizedPage`'s results screen, right after the existing results.
- **2 new config files:** `.gitignore` (so `.env` never gets committed) and
  `.env.example` (a template showing what variables to set — no real key).

**Nothing else changed.** The dataset, the matching/scoring logic, the
visual design, the page structure, the theme system — all exactly as they
were.

## Where the Featherless API call actually happens

Everything network-related lives in one function: `askLunaris()` inside
`src/utils/featherless.js`. It's called from one place: `handleAsk()`
inside the `AskLunarisPanel` component in `Lunaris.jsx`.

## How the existing matching system and Featherless work together

1. `DiscoveryPage` (via `searchOpportunities()`) or `PersonalizedPage` (via
   `matchOpportunities()`) — both **unchanged**, both already in your
   codebase — produce a list of relevant opportunities exactly as before.
2. That same list is now also handed to `AskLunarisPanel` as a prop.
3. When the student clicks "Ask Lunaris," the panel sends that list
   (capped to the top 8) plus their question — and, on the Personalized
   page, their profile — to Featherless.
4. Featherless is explicitly instructed to only talk about the
   opportunities it was given, never to invent new ones.

Featherless never decides *which* scholarships are relevant — your
existing deterministic engine still does that. Featherless only explains,
in plain English, the results that engine already found.

## Exactly what to do in VS Code to run it

1. In the project's root folder (same level as `package.json`), find the
   file `.env.example`. Make a copy of it, and rename the copy to `.env`
   (just `.env`, nothing else). In VS Code: right-click `.env.example` →
   Copy → right-click the folder → Paste → rename to `.env`.
2. Open `.env` and paste your real Featherless API key after the `=` sign:
   ```
   VITE_FEATHERLESS_API_KEY=your_real_key_here
   ```
3. Save the file.
4. In the VS Code terminal, stop the dev server if it's running
   (click into the terminal, press Control+C), then start it again:
   ```
   npm run dev
   ```
   (Environment variables are only read when the server starts, so it
   must be restarted after editing `.env`.)
5. Open the printed `localhost` link in your browser.

`.env` is already listed in `.gitignore`, so it will never be uploaded to
GitHub even if you push the rest of the project.

## How to test it

1. Click **Find Opportunities** (or fill in **Find What You're Eligible
   For**) so you have a list of results on screen.
2. Scroll down — you'll see a new **Ask Lunaris** box below the results,
   with a "Powered by Featherless AI" tag.
3. Type a question and click **Ask Lunaris**.
4. You should see "Asking Featherless AI about N matched
   opportunities…", then a written answer appears in a highlighted box.

**If you see a red error message instead:**
- *"Featherless API key not found"* → you haven't created `.env` yet, or
  forgot to restart `npm run dev` after adding it.
- *"Featherless rejected the API key (401)"* → the key in `.env` is
  wrong or expired — get a fresh one from your Featherless account.
- *"Could not reach Featherless from the browser (a network/CORS
  error)"* → **this is the one case where the simple approach might not
  work.** Come back and tell me if you see this exact message, and I'll
  build the small serverless-proxy fallback we discussed — don't try to
  fix this one yourself.
- *"couldn't find the model ... (404)"* → the default model isn't on your
  plan. Add a line to `.env`: `VITE_FEATHERLESS_MODEL=` followed by a
  model ID from your Featherless account/dashboard.

## Example questions for the hackathon demo

- *"I'm an EWS engineering student from Telangana, my family income is
  ₹2 lakh. Which scholarships can I apply for?"*
- *"I'm a girl in Class 11 from a minority community — is there anything
  for me?"*
- *"What documents will I need if I want to apply for the PM Internship
  Scheme?"* (ask this one from the Details page's matched context, or
  search "PM Internship" on Discovery first so it's in the results shown)

## What to say when judges ask "Where did you use Featherless AI?"

*"Our matching engine is a deterministic, explainable system — it scores
every scholarship against a student's profile using clear rules, so we
always know exactly why something matched. Featherless AI sits on top of
that as our 'Ask Lunaris' feature: it takes the exact scholarships our own
engine already identified and explains them to the student in plain,
natural language, answering follow-up questions without ever inventing
facts that aren't in our data."*

That sentence covers what it does, why it's meaningful (not decorative),
and why the architecture is sound (grounded, not hallucinating).

## How to prove it's really live, not hardcoded

- Ask a question live, on the spot, that a judge suggests — not one of
  your rehearsed examples. A canned response can't handle that.
- Open the browser's DevTools → Network tab before asking, and point out
  the live request going out to `api.featherless.ai` when you click "Ask
  Lunaris."
- Ask the same question twice, worded slightly differently — a real model
  will phrase its answer a little differently each time; a hardcoded
  response would be identical.
