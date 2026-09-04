/**
 * Lunaris — Deterministic Eligibility Matching
 * -----------------------------------------------------------------------
 * Simple, explainable scoring for the hackathon prototype. No ML/AI —
 * just transparent, rule-based scoring so every match can be justified
 * with a plain-language reason. This can be swapped for a smarter
 * recommendation engine later without touching the UI.
 *
 * Weights (per criterion, only counted when the criterion actually
 * applies to a given opportunity):
 *   Education match   +3
 *   State match        +3
 *   Income match       +3
 *   Category match     +2
 *   Age match          +2
 *   Gender match       +1
 *   Disability focus   +1 (only for disability-focused opportunities)
 *   Minority focus     +1 (only for minority-focused opportunities)
 */

export function scoreOpportunity(opp, profile) {
  const elig = opp.eligibility || {};
  let score = 0;
  let maxScore = 0;
  const reasons = [];

  // ---- Education (+3) ----------------------------------------------
  maxScore += 3;
  const eduList = elig.education || [];
  const eduOpen = eduList.length === 0 || eduList.includes("Any");
  if (eduOpen) {
    score += 3;
    reasons.push("Open to all education levels");
  } else if (profile.education && eduList.includes(profile.education)) {
    score += 3;
    reasons.push(`Matches your education level (${profile.education})`);
  }

  // ---- State (+3) -----------------------------------------------------
  maxScore += 3;
  if (opp.state === "All India") {
    score += 3;
    reasons.push("Available across India");
  } else if (profile.state && opp.state === profile.state) {
    score += 3;
    reasons.push(`Available in ${profile.state}`);
  }

  // ---- Income (+3) ------------------------------------------------------
  maxScore += 3;
  if (elig.incomeLimit == null) {
    score += 3;
    reasons.push("No specific income restriction");
  } else if (
    profile.income !== "" &&
    profile.income != null &&
    !Number.isNaN(Number(profile.income)) &&
    Number(profile.income) <= elig.incomeLimit
  ) {
    score += 3;
    reasons.push("Family income is within the stated eligibility limit");
  }

  // ---- Category (+2) ------------------------------------------------
  maxScore += 2;
  const catList = elig.category || [];
  if (profile.category && catList.includes(profile.category)) {
    score += 2;
    reasons.push(`${profile.category} category matched`);
  }

  // ---- Age (+2) -------------------------------------------------------
  maxScore += 2;
  const noAgeLimit = elig.minAge == null && elig.maxAge == null;
  if (noAgeLimit) {
    score += 2;
    reasons.push("No specific age restriction");
  } else if (profile.age !== "" && profile.age != null && !Number.isNaN(Number(profile.age))) {
    const age = Number(profile.age);
    const minOk = elig.minAge == null || age >= elig.minAge;
    const maxOk = elig.maxAge == null || age <= elig.maxAge;
    if (minOk && maxOk) {
      score += 2;
      reasons.push("Age within the eligible range");
    }
  }

  // ---- Gender (+1) ------------------------------------------------------
  maxScore += 1;
  if (!elig.gender || elig.gender === "All") {
    score += 1;
    reasons.push("Open to all genders");
  } else if (profile.gender && profile.gender === elig.gender) {
    score += 1;
    reasons.push(`Open to ${profile.gender.toLowerCase()} applicants`);
  }

  // ---- Disability focus (+1, only when relevant) -----------------------
  if (elig.disabilityFocus) {
    maxScore += 1;
    if (profile.disability) {
      score += 1;
      reasons.push("Specifically supports applicants with disabilities");
    }
  }

  // ---- Minority focus (+1, only when relevant) -------------------------
  if (elig.minorityFocus) {
    maxScore += 1;
    if (profile.minority) {
      score += 1;
      reasons.push("Specifically supports minority-community applicants");
    }
  }

  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  return { score, maxScore, pct, reasons };
}

/**
 * Score and rank every opportunity against a user profile.
 * Returns opportunities with a `_match` field attached, sorted by
 * match percentage (highest first), excluding non-matches (0%).
 */
export function matchOpportunities(opportunities, profile, { minPct = 25 } = {}) {
  return opportunities
    .map((opp) => ({ ...opp, _match: scoreOpportunity(opp, profile) }))
    .filter((opp) => opp._match.pct >= minPct)
    .sort((a, b) => b._match.pct - a._match.pct);
}

/**
 * Search + filter helper shared by the Discovery page.
 * `filters` may contain: category, applicantCategory, educationLevel,
 * level (Central/State), state.
 */
export function searchOpportunities(opportunities, query, filters = {}) {
  const q = (query || "").trim().toLowerCase();

  return opportunities.filter((opp) => {
    if (filters.category && filters.category !== "All" && opp.category !== filters.category) {
      return false;
    }
    if (filters.level && filters.level !== "All" && opp.level !== filters.level) {
      return false;
    }
    if (filters.state && filters.state !== "All" && opp.state !== filters.state && opp.state !== "All India") {
      return false;
    }
    if (
      filters.educationLevel &&
      filters.educationLevel !== "All" &&
      !(opp.eligibility?.education || []).some(
        (e) => e === filters.educationLevel || e === "Any"
      )
    ) {
      return false;
    }
    if (
      filters.applicantCategory &&
      filters.applicantCategory !== "All" &&
      !(opp.eligibility?.category || []).includes(filters.applicantCategory)
    ) {
      return false;
    }

    if (!q) return true;

    const haystack = [
      opp.name,
      opp.category,
      opp.type,
      opp.description,
      opp.provider,
      opp.state,
      ...(opp.tags || []),
      ...(opp.eligibility?.category || []),
      ...(opp.eligibility?.education || []),
    ]
      .join(" ")
      .toLowerCase();

    // tolerant of basic wording differences: match on every word typed
    const words = q.split(/\s+/).filter(Boolean);
    return words.every((w) => haystack.includes(w));
  });
}

export function formatIncome(limit) {
  if (limit == null) return "No specific income limit";
  return `Up to ₹${limit.toLocaleString("en-IN")} per year (family income)`;
}

export function formatAgeRange(minAge, maxAge) {
  if (minAge == null && maxAge == null) return "No specific age restriction";
  if (minAge != null && maxAge != null) return `${minAge}–${maxAge} years`;
  if (minAge != null) return `${minAge}+ years`;
  return `Up to ${maxAge} years`;
}
