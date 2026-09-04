# Lunaris
**Scholarships & Government Schemes, Made Discoverable**

> "One Stop Solution for all your problems."
---

##  The Problem

India runs thousands of scholarships, grants, fee waivers, and welfare schemes across central ministries, state departments, Private NGOs, charitable trusts, and corporate companies and individual institutions yet a huge share go unclaimed every year.

- Scheme information is fragmented across **100+ central and state government websites/PDFs**.
- There is significant uncertainty surrounding data from private NGOs and charitable trusts due to limited transparency and a lack of consistently verified sources. This creates concerns about data reliability and increases the risk of misinformation, fraud, and scams.
- Eligibility criteria are written in **formal language**, hard for a layperson to understand.
- There's no single interface where a student can describe themselves in plain words and get a personalised match list.
- Deadlines are missed simply because **no one knew the scheme existed** in the first place.

This disproportionately affects first generation learners, rural students, and those without access to career counsellors, the people who need these schemes most, and are least equipped to find them.

**This is a discovery problem, not an eligibility problem.** The money and opportunity already exist; people just never find out they qualify.

---
## The Impact

The opportunities, funding, and support mechanisms already exist. The missing layer is a **trusted, intelligent discovery system** that brings scattered information together, verifies it where possible, translates complex criteria into understandable language, and connects each student with the opportunities they are most likely to qualify for.

---
## AI Implementation

An AI-powered opportunity finder where a student describes their background in plain, conversational language - state, category, family income, course/level of study, gender, disability status, minority status, etc. 

The system matches this profile against a structured, continuously updated knowledge base of scholarships and schemes, and returns a **ranked, explained list** of what the student actually qualifies for, along with deadlines, required documents, and direct application links.

**Core idea in one line:** Describe yourself once in your own words → get a personalised, explained list of every scholarship/scheme you're eligible for, with deadlines and next steps.

---

## Key Features

| Feature                                  | Description                                                                                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Conversational intake**                | Free text or voice input no rigid multi-page forms. Follow up questions asked only when needed to disambiguate eligibility.                                      |
| **Eligibility matching engine**          | Structured rule matching (income slabs, category, state, course) combined with LLM reasoning for nuanced/soft criteria.                                            |
| **Explainable results**                  | Every match shows _why_ the student qualifies (e.g. "You match because: Telangana domicile + OBC + income under ₹2.5L"), and every non-match shows what's missing. |
| **Deadline & document tracker**          | Each result includes application deadline, a required documents checklist, and a direct link to apply.                                                             |
| **AI Chatbot**                 | Integrated an AI chatbot powered by Featherless AI to provide users with personalized assistance in discovering and understanding relevant opportunities.                                                                   |
| **Personalized alerts** _(stretch)_      | Opt in reminders when a new scheme matching the student's saved profile is published.                                                                              |
| **Counsellor/NGO dashboard** _(stretch)_ | Bulk upload a list of students; get matches for an entire classroom or district at once.                                                                           |

---

##  How It Works

1. **Profile capture** - Student types a free form description of themselves.
2. **Structuring** - An LLM extracts structured fields (state, category, income, course, gender, disability, minority status) from the free text, asking a clarifying question only if a critical field is missing.
3. **Matching** - The structured profile is checked against the eligibility rules of every scheme in the knowledge base using a rule engine; borderline/ambiguous cases are resolved by the LLM reading the actual eligibility clause.
4. **Ranking & explanation** - Matches are ranked by benefit value and deadline urgency, each shown with a plain language reason and a document checklist.
5. **Action** - Student gets direct links to apply, can save/bookmark schemes, and (stretch) opt in to reminders.

---

## Technical Architecture & Tech Stack

### Overview

Lunaris is a fully client-side, static single-page application — there is no backend server or database. All scholarship/scheme data ships inside the JavaScript bundle, all matching logic runs in the browser, and the only outbound network call is an optional, on-demand request to an external AI API for the "Ask Lunaris" explain-in-plain-English feature.

### Tech Stack

| Layer | Technology |
|---|---|
| UI library | React 18 |
| Build tool / dev server | Vite 8 (`@vitejs/plugin-react` for JSX + Fast Refresh) |
| Styling | Tailwind CSS 3 (compiled via PostCSS + Autoprefixer — a real build dependency, not a CDN script, so it works fully offline) |
| Icons | lucide-react |
| Routing | None (`react-router` is not used) — a lightweight custom `useNav` hook drives view switching via component state |
| Data storage | Static JS module (`src/data/opportunities.js`) — no database |
| Matching/search logic | Hand-written deterministic scoring engine (`src/utils/matching.js`) — no ML model |
| Optional AI layer | Featherless AI's OpenAI-compatible Chat Completions API, called directly from the browser (`src/utils/featherless.js`) |
| Hosting | Render (Static Site) |

### Project Structure

```
lunaris-app/
├── index.html              # page shell, mounts #root
├── vite.config.js          # Vite + React plugin config
├── tailwind.config.js      # scans index.html + src/**/*.{js,jsx}
├── postcss.config.js       # wires Tailwind into the build
├── src/
│   ├── main.jsx             # entry point — mounts <Lunaris /> into #root
│   ├── index.css            # Tailwind's @tailwind directives
│   ├── Lunaris.jsx           # the entire application (all pages + components)
│   ├── data/
│   │   └── opportunities.js  # the full scholarships/schemes dataset
│   └── utils/
│       ├── matching.js       # eligibility scoring, search & filtering
│       └── featherless.js    # "Ask Lunaris" AI integration
```

### Application Architecture

**1. Single-file component tree (`Lunaris.jsx`)**
The whole UI lives in one file, organized as a flat set of components rather than a deep folder hierarchy:
- **Design-system primitives:** `GlassCard`, `PrimaryButton`, `SecondaryButton`, `CrescentMark`, `GlobalStyles` (CSS custom properties for the theme)
- **Visual/background:** `GlobalStarfield` (animated canvas background)
- **Page sections (composed on the home page):** `Navbar`, `Hero`, `Stats`, `Categories`, `PersonalizedDiscovery`, `HowItWorks`, `FeaturedOpportunities`, `WhyLunaris`, `OrbitDiagram`, `FinalCTA`, `Footer`
- **Full pages:** `HomePage`, `DiscoveryPage`, `DetailsPage`, `PersonalizedPage`
- **Feature component:** `AskLunarisPanel` (the AI explain feature, mounted inside `DiscoveryPage` and `PersonalizedPage`)

**2. State-based "routing"**
There's no URL-based router. A small `useNav` hook holds the current page name (`"home"`, `"discovery"`, `"details"`, `"personalized"`) plus any params (filters, scroll targets) in component state, and `navigate(page, params)` swaps which page component renders. This keeps the app a true single-page bundle with instant, client-only transitions.

**3. Theming**
Colors are defined once as CSS custom properties inside `GlobalStyles()`, under `:root`/`[data-theme="dark"]` and `[data-theme="light"]`. Every component reads from those variables. The navbar's theme toggle flips a `data-theme` attribute on `<html>` and persists the choice in `localStorage`.

**4. Data layer**
`src/data/opportunities.js` exports a static array of opportunity objects (scholarships, government schemes, fellowships, financial aid, etc.), each following a consistent schema:

```js
{
  id, name, category, type, description, provider, level, state,
  eligibility: { minAge, maxAge, gender, category, education, incomeLimit, disabilityFocus, minorityFocus },
  benefits, documents, applicationUrl, deadline, tags
}
```
It also exports supporting enums (`CATEGORY_LIST`, `EDUCATION_LEVELS`, `APPLICANT_CATEGORIES`, `INDIAN_STATES`) used to drive filter UI and keep values consistent.

**5. Matching & search engine (`matching.js`)**
A deterministic, fully explainable rules engine — intentionally not ML-based, so every result can be justified in plain language:
- `scoreOpportunity(opp, profile)` — weights each eligibility criterion (education +3, state +3, income +3, category +2, age +2, gender +1, disability focus +1, minority focus +1) and returns a score, a percentage match, and a list of human-readable reasons.
- `matchOpportunities(opportunities, profile)` — scores and ranks the full dataset against a student profile for the Personalized flow.
- `searchOpportunities(opportunities, query, filters)` — powers free-text search plus category/state/education/applicant-category filtering on the Discovery page.

**6. "Ask Lunaris" AI layer (`featherless.js`)**
An optional, additive feature layered on top of the deterministic engine — it never decides which opportunities are relevant, only explains ones the engine already found:
1. `DiscoveryPage`/`PersonalizedPage` produce a ranked/filtered list via the matching engine (unchanged).
2. That list (capped to the top 8) plus the student's question — and profile, where available — is sent to Featherless AI's chat completions endpoint (`api.featherless.ai/v1/chat/completions`), called directly from the browser via `fetch()`.
3. A system prompt explicitly restricts the model to only the supplied opportunities, instructing it never to invent scholarships, deadlines, or eligibility facts.
4. Default model: `Qwen/Qwen2.5-7B-Instruct`, overridable via `VITE_FEATHERLESS_MODEL`.

> **Note:** the Featherless API key (`VITE_FEATHERLESS_API_KEY`) is read from a Vite env variable and is bundled into the client-side JS — acceptable for a demo/prototype, but for production use this call should be moved behind a small serverless function so the key isn't exposed in the browser.

### Deployment

- **Host:** Render, as a Static Site
- **Root Directory:** `lunaris-app`
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`
- No environment variables are required unless "Ask Lunaris" is enabled, in which case `VITE_FEATHERLESS_API_KEY` (and optionally `VITE_FEATHERLESS_MODEL`) must be set in Render's environment settings.
- No server-side routing rules are needed since the app doesn't use URL-based routing.

### Design Principles

- **Deterministic first, AI second:** eligibility matching is rule-based and fully explainable; the AI layer only narrates results the deterministic engine already produced, so it can't hallucinate scholarships that don't exist in the dataset.
- **Offline-friendly build:** Tailwind is a compiled build dependency, not a CDN import, so the app builds and runs without depending on external stylesheets at runtime.
- **Single source of truth for data:** all opportunity data lives in one file with one schema, so adding new scholarships doesn't require touching matching logic, filters, or UI.

---

## Data Requirements & Sources

This project doesn't need sensitive personal data or large historical datasets, the core asset is a well structured scheme knowledge base.

- [National Scholarship Portal](https://scholarships.gov.in) - central government schemes
- State welfare department portals (e.g., Telangana ePASS, e-Kalyan) state specific schemes
- AICTE / UGC scholarship listings to find higher education specific schemes
- Reliance and Aditya Birla foundation scholarships

---

##  Key Challenges & Mitigations

---UPDATE PENDING---

---

##  Expected Impact

- Converts a fragmented, multi hour research task into a **two-minute conversation**.
- Directly increases scheme uptake among students who currently miss out due to lack of awareness, not ineligibility.
- Scalable to NGOs and school counsellors, who can use it to help entire batches of students at once.
- A strong social impact narrative: bridges an information access gap rather than building a new benefit from scratch.

---

##  Future Roadmap

- Auto-updating scheme database via scheduled scraping + LLM assisted structuring of new notifications
- WhatsApp bot interface for zero app install access in rural areas
- Application auto-fill: pre populate government application forms from the student's saved profile
- Expansion beyond scholarships to include internships, fellowships, and skill development schemes

---

