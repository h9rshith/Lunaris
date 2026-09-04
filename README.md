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
| **Multilingual support**                 | Regional language input/output (starting with Telugu/Hindi) so English literacy isn't a barrier.                                                                   |
| **Personalized alerts** _(stretch)_      | Opt in reminders when a new scheme matching the student's saved profile is published.                                                                              |
| **Counsellor/NGO dashboard** _(stretch)_ | Bulk upload a list of students; get matches for an entire classroom or district at once.                                                                           |

---

##  How It Works

1. **Profile capture** - Student types a free form description of themselves.
2. **Structuring** - An LLM extracts structured fields (state, category, income, course, gender, disability, minority status) from the free text, asking a clarifying question only if a critical field is missing.
3. **Matching** - The structured profile is checked against the eligibility rules of every scheme in the knowledge base using a rule engine; borderline/ambiguous cases are resolved by the LLM reading the actual eligibility clause.
4. **Ranking & explanation** - Matches are ranked by benefit value and deadline urgency, each shown with a plain language reason and a document checklist.
5. **Action** - Student gets direct links to apply, can save/bookmark schemes, and (stretch) opt in to reminders.

```
User Input (text)
      │
      ▼
NLP Extraction (LLM)
      │
      ▼
Structured Profile (JSON)
      │
      ▼
Rule Engine + RAG Retrieval over Scheme DB
      │
      ▼
Ranked Matches with Explanations
      │
      ▼
Results UI (cards: deadline, documents, apply link)
```

---

##  Technical Architecture

---UPDATE PENDING--

---

##  Tech Stack

---UPDATE PENDING---

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

