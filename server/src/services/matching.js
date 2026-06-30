/**
 * kidcircle/server/src/services/matching.js
 * Core AI Concierge matching logic — interest weighting, geography scoring, age verification.
 * Now supports both providers and one-time events (camps, workshops, shows).
 */

import db from '../db/connection.js';

// === Interest-to-Category Mapping ===
const INTEREST_MAP = {
  coding: 'cat-coding',
  engineering: 'cat-coding',
  technology: 'cat-coding',
  'computer': 'cat-coding',
  programming: 'cat-coding',
  robotics: 'cat-coding',
  stem: 'cat-science',
  science: 'cat-science',
  chemistry: 'cat-science',
  'nature': 'cat-science',
  outdoor: 'cat-camp',
  camping: 'cat-camp',
  sports: 'cat-sports',
  soccer: 'cat-sports',
  tennis: 'cat-sports',
  gymnastics: 'cat-sports',
  swimming: 'cat-sports',
  music: 'cat-music',
  piano: 'cat-music',
  guitar: 'cat-music',
  singing: 'cat-music',
  'art': 'cat-art',
  pottery: 'cat-art',
  painting: 'cat-art',
  crafts: 'cat-art',
  cooking: 'cat-art',
  'dance': 'cat-dance',
  ballet: 'cat-dance',
  hiphop: 'cat-dance',
  tutoring: 'cat-tutoring',
  math: 'cat-math',
  reading: 'cat-tutoring',
  writing: 'cat-tutoring',
  language: 'cat-language',
  spanish: 'cat-language',
  french: 'cat-language',
  acting: 'cat-art',
  theatre: 'cat-art',
  improv: 'cat-art',
  drama: 'cat-art',
  martial: 'cat-sports',
  taekwondo: 'cat-sports',
};

// === Metro Area Constants (Austin) ===
const AUSTIN_AREAS = {
  '78701': { name: 'Downtown', side: 'central', area: 'central' },
  '78702': { name: 'East Austin', side: 'east', area: 'east' },
  '78703': { name: 'West Austin', side: 'west', area: 'west' },
  '78704': { name: 'South Austin', side: 'south', area: 'south' },
  '78731': { name: 'Northwest Hills', side: 'northwest', area: 'northwest' },
  '78746': { name: 'Westlake', side: 'west', area: 'west' },
  '78756': { name: 'North Central', side: 'north', area: 'north' },
  '78757': { name: 'North Central', side: 'north', area: 'north' },
  '78758': { name: 'North Austin', side: 'north', area: 'north' },
  '78759': { name: 'Arboretum', side: 'northwest', area: 'northwest' },
  '78613': { name: 'Cedar Park', side: 'northwest', area: 'suburb' },
  '78681': { name: 'Round Rock', side: 'north', area: 'suburb' },
  '78660': { name: 'Pflugerville', side: 'northeast', area: 'suburb' },
  '78727': { name: 'North Austin', side: 'north', area: 'north' },
  '78750': { name: 'Anderson Mill', side: 'northwest', area: 'northwest' },
  '78738': { name: 'Lakeway', side: 'west', area: 'suburb' },
  '78734': { name: 'Lakeway', side: 'west', area: 'suburb' },
  '78732': { name: 'Steiner Ranch', side: 'west', area: 'west' },
  '78739': { name: 'Circle C', side: 'southwest', area: 'south' },
  '78745': { name: 'South Austin', side: 'south', area: 'south' },
  '78748': { name: 'Southpark Meadows', side: 'south', area: 'south' },
  '78749': { name: 'Southwest Hills', side: 'southwest', area: 'south' },
  '78664': { name: 'Round Rock East', side: 'north', area: 'suburb' },
  '78641': { name: 'Leander', side: 'northwest', area: 'suburb' },
};

// === Traffic Tolerance: max drive time in minutes ===
const TRAFFIC_TOLERANCE = { low: 15, medium: 30, high: 60 };

// === Major Artery Crossings (MoPac = LP 1, I-35) ===
function crossesMajorArtery(zipA, zipB) {
  const areaA = AUSTIN_AREAS[zipA];
  const areaB = AUSTIN_AREAS[zipB];
  if (!areaA || !areaB) return false;

  const oppositeSides = [
    ['west', 'east'], ['west', 'north'], ['west', 'south'],
    ['northwest', 'south'], ['northwest', 'east'],
    ['southwest', 'north'], ['southwest', 'east'],
  ];

  return oppositeSides.some(([s1, s2]) =>
    (areaA.side === s1 && areaB.side === s2) ||
    (areaA.side === s2 && areaB.side === s1)
  );
}

// === Same Neighborhood Check ===
function sameNeighborhood(zipA, zipB) {
  const areaA = AUSTIN_AREAS[zipA];
  const areaB = AUSTIN_AREAS[zipB];
  if (!areaA || !areaB) return false;
  return areaA.area === areaB.area;
}

// === Zip proximity scoring ===
function zipDistance(zipA, zipB) {
  if (!zipA || !zipB) return 99;
  const areaA = AUSTIN_AREAS[zipA];
  const areaB = AUSTIN_AREAS[zipB];
  if (!areaA || !areaB) return 99;
  if (zipA === zipB) return 0;
  if (areaA.area === areaB.area) return 3;
  if (areaA.side === areaB.side) return 5;
  return 10 + (crossesMajorArtery(zipA, zipB) ? 15 : 0);
}

/**
 * Calculate how many days until an event starts (for near-term prioritization).
 * Returns 0 if the event is already happening today or in the past.
 */
function daysUntil(startDateStr) {
  if (!startDateStr) return 999;
  const now = new Date();
  const start = new Date(startDateStr + 'T00:00:00');
  const diff = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

/**
 * Score an event based on interests, geography, traffic, and near-term priority.
 */
function scoreEvent(event, categoryIds, childAge, zipCode, trafficTolerance) {
  let score = 0;
  const reasons = [];

  // Interest match
  if (categoryIds.has(event.category_id)) {
    score += 30;
    reasons.push('Interest match');
  }

  // Geography scoring
  const prox = zipDistance(zipCode, event.zip_code);
  if (prox <= 0) {
    score += 20;
    reasons.push('Same location');
  } else if (prox <= 3) {
    score += 10;
    reasons.push('Nearby neighborhood');
  } else if (prox > 10) {
    score -= 15;
    if (crossesMajorArtery(zipCode, event.zip_code)) {
      reasons.push('Crosses MoPac/I-35 — longer drive');
    }
  }

  // Traffic tolerance check
  if (prox > TRAFFIC_TOLERANCE[trafficTolerance] / 3) {
    if (trafficTolerance === 'low' && prox > 5) {
      score -= 20;
      reasons.push('Exceeds low traffic tolerance');
    }
  }

  // Near-term priority: events starting within 7 days get a big boost
  const dUntil = daysUntil(event.start_date);
  if (dUntil === 0) {
    score += 25;
    reasons.push('Happening today!');
  } else if (dUntil <= 3) {
    score += 20;
    reasons.push('Happening this week — don\'t miss out!');
  } else if (dUntil <= 7) {
    score += 15;
    reasons.push('Coming up soon');
  } else if (dUntil <= 14) {
    score += 10;
    reasons.push('Coming up in the next two weeks');
  } else if (dUntil <= 30) {
    score += 5;
    reasons.push('This month');
  }

  // Past events get heavily penalized (shouldn't normally appear but safety net)
  if (dUntil > 365) {
    score -= 50;
    reasons.push('Event already passed');
  }

  return { score, reasons, prox };
}

/**
 * Main matching function — returns both providers and events.
 * @param {Object} params - { childAge, interests[], zipCode, trafficTolerance, schedule }
 * @returns {Array} ranked recommendations with scores & tips (providers + events interleaved)
 */
export async function findMatches({ childAge, interests = [], zipCode, trafficTolerance = 'medium', schedule }) {
  const maxDriveTime = TRAFFIC_TOLERANCE[trafficTolerance] || 30;

  // 1. Map interests to category IDs
  const categoryIds = new Set();
  for (const interest of interests) {
    const catId = INTEREST_MAP[interest.toLowerCase().trim()];
    if (catId) categoryIds.add(catId);
  }

  // ==========================================
  // 2. Fetch matching ACTIVE PROVIDERS
  // ==========================================
  let providerSql = 'SELECT *, \'provider\' AS result_type FROM providers WHERE active = 1';
  const providerArgs = [];

  if (categoryIds.size > 0) {
    const placeholders = Array.from(categoryIds).map(() => '?').join(',');
    providerSql += ` AND category_id IN (${placeholders})`;
    providerArgs.push(...Array.from(categoryIds));
  }

  // Age filter for providers
  providerSql += ' AND age_range_min <= ? AND age_range_max >= ?';
  providerArgs.push(childAge, childAge);

  const providerResult = await db.execute({ sql: providerSql, args: providerArgs });
  const providers = providerResult.rows;

  // ==========================================
  // 3. Fetch matching EVENTS
  // ==========================================
  let eventSql = 'SELECT *, \'event\' AS result_type FROM events WHERE active = 1';
  const eventArgs = [];

  if (categoryIds.size > 0) {
    const placeholders = Array.from(categoryIds).map(() => '?').join(',');
    eventSql += ` AND category_id IN (${placeholders})`;
    eventArgs.push(...Array.from(categoryIds));
  }

  // Only include events with start_date >= today (or not ended yet)
  eventSql += " AND (end_date IS NULL OR end_date >= date('now'))";

  const eventResult = await db.execute({ sql: eventSql, args: eventArgs });
  const events = eventResult.rows;

  // ==========================================
  // 4. Score providers
  // ==========================================
  const scoredProviders = providers.map(provider => {
    let score = 0;
    const reasons = [];

    // Interest match
    if (categoryIds.has(provider.category_id)) {
      score += 30;
      reasons.push('Interest match');
    }

    // Geography scoring
    const prox = zipDistance(zipCode, provider.zip_code);
    if (prox <= 0) {
      score += 20;
      reasons.push('Same location');
    } else if (prox <= 3) {
      score += 10;
      reasons.push('Nearby neighborhood');
    } else if (prox > 10) {
      score -= 15;
      if (crossesMajorArtery(zipCode, provider.zip_code)) {
        reasons.push('Crosses MoPac/I-35 — longer drive');
      }
    }

    // Traffic tolerance check
    if (prox > maxDriveTime / 3) {
      if (trafficTolerance === 'low' && prox > 5) {
        score -= 20;
        reasons.push('Exceeds low traffic tolerance');
      }
    }

    // Age verification bonus
    if (provider.age_range_min <= childAge && provider.age_range_max >= childAge) {
      score += 5;
    }

    // Rating & review density
    if (provider.avg_rating >= 4.5) {
      score += 15;
      reasons.push('Top-rated by parents');
    } else if (provider.avg_rating >= 4.0) {
      score += 10;
      reasons.push('Highly recommended');
    }

    if (provider.review_count >= 5) {
      score += 5;
      reasons.push('Proven track record');
    }

    // Premium partner bonus
    if (provider.tier === 'premium') {
      score += 10;
      reasons.push('Partner provider — priority access');
    }

    // Verified bonus
    if (provider.verified) {
      score += 5;
    }

    return {
      result_type: 'provider',
      id: provider.id,
      name: provider.name,
      description: provider.description,
      category_id: provider.category_id,
      zip_code: provider.zip_code,
      avg_rating: provider.avg_rating,
      review_count: provider.review_count,
      tier: provider.tier,
      verified: provider.verified,
      age_range_min: provider.age_range_min,
      age_range_max: provider.age_range_max,
      price_range: provider.price_range,
      logo_url: provider.logo_url,
      website: provider.website,
      phone: provider.phone,
      address: provider.address,
      lat: provider.lat,
      lng: provider.lng,
      start_date: null,
      end_date: null,
      provider_name: provider.name,
      match_score: Math.min(100, Math.max(0, score)),
      match_reasons: reasons,
      prox_distance: prox,
      near_term_bonus: false,
    };
  });

  // ==========================================
  // 5. Score events
  // ==========================================
  const scoredEvents = events.map(event => {
    const { score, reasons, prox } = scoreEvent(event, categoryIds, childAge, zipCode, trafficTolerance);
    const dUntil = daysUntil(event.start_date);

    return {
      result_type: 'event',
      id: event.id,
      name: event.name,
      description: event.description,
      category_id: event.category_id,
      zip_code: event.zip_code,
      avg_rating: null,
      review_count: null,
      tier: null,
      verified: null,
      age_range_min: null,
      age_range_max: null,
      price_range: event.price,
      logo_url: null,
      website: event.website,
      phone: null,
      address: event.address,
      lat: event.lat,
      lng: event.lng,
      start_date: event.start_date,
      end_date: event.end_date,
      start_time: event.start_time,
      end_time: event.end_time,
      provider_id: event.provider_id,
      provider_name: null, // resolved below
      match_score: Math.min(100, Math.max(0, score)),
      match_reasons: reasons,
      prox_distance: prox,
      near_term_bonus: dUntil <= 7,
    };
  });

  // Resolve provider names for events that reference a provider
  if (scoredEvents.length > 0) {
    const provIds = [...new Set(scoredEvents.filter(e => e.provider_id).map(e => e.provider_id))];
    if (provIds.length > 0) {
      const placeholders = provIds.map(() => '?').join(',');
      const provResult = await db.execute({
        sql: `SELECT id, name FROM providers WHERE id IN (${placeholders})`,
        args: provIds,
      });
      const provMap = {};
      for (const row of provResult.rows) {
        provMap[row.id] = row.name;
      }
      for (const event of scoredEvents) {
        if (event.provider_id && provMap[event.provider_id]) {
          event.provider_name = provMap[event.provider_id];
        }
      }
    }
  }

  // ==========================================
  // 6. Combine & sort: highest scores first
  //    If within 5 points of each other, events score higher (near-term boost)
  // ==========================================
  const combined = [...scoredProviders, ...scoredEvents];

  // Custom sort: desc by score, with events getting a tiny tiebreaker
  combined.sort((a, b) => {
    const scoreDiff = b.match_score - a.match_score;
    if (Math.abs(scoreDiff) > 5) return scoreDiff;
    // Within 5 points: events first (near-term priority)
    if (a.result_type !== b.result_type) {
      return a.result_type === 'event' ? -1 : 1;
    }
    return scoreDiff;
  });

  // ==========================================
  // 7. Build logistics tips for top results
  // ==========================================
  const results = combined.slice(0, 8).map((entry, i) => {
    const tips = [];
    const entryZip = entry.zip_code;
    const prox = zipDistance(zipCode, entryZip);

    if (crossesMajorArtery(zipCode, entryZip) && trafficTolerance !== 'high') {
      tips.push('Plan for MoPac/I-35 crossing during rush hour (4-6:30 PM)');
    }
    if (sameNeighborhood(zipCode, entryZip)) {
      tips.push('In your neighborhood — carpool or walking possible');
    }
    if (prox <= 3) {
      tips.push('Close drive — under 15 minutes');
    } else if (prox <= 10) {
      tips.push('Moderate drive — plan 15-30 minutes');
    } else {
      tips.push('Longer commute — consider carpooling');
    }

    if (entry.result_type === 'event') {
      const dUntil = daysUntil(entry.start_date);
      if (dUntil === 0) {
        tips.push('Happening today! Check event times');
      } else if (dUntil <= 3) {
        tips.push('Coming up soon — register now');
      } else if (dUntil <= 7) {
        tips.push('This week — spots may be limited');
      }
    }

    if (entry.result_type === 'provider' && entry.tier === 'premium') {
      tips.push('Partner provider — eligible for priority booking');
    }

    if (entry.result_type === 'event' && entry.provider_name) {
      tips.push(`Hosted by ${entry.provider_name}`);
    }

    return {
      ...entry,
      logistics_tip: tips.length > 0 ? tips.join('; ') : null,
      rank: i + 1,
    };
  });

  return results;
}

/**
 * Return available interest tags and neighborhood options.
 */
export function getPreferences() {
  const interests = Object.keys(INTEREST_MAP)
    .filter((v, i, a) => a.indexOf(v) === i) // unique
    .sort();

  const neighborhoods = Object.entries(AUSTIN_AREAS).map(([zip, info]) => ({
    zip_code: zip,
    name: info.name,
    area: info.area,
  }));

  return { interests, neighborhoods };
}
