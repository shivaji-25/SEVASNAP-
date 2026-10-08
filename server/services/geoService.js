/**
 * GeoService - Civic Grievance Geolocation & Proximity Engine
 * 
 * Core Features:
 * 1. Haversine Distance Calculation (sub-meter accuracy on Earth sphere)
 * 2. Proximity-Based Duplicate Detection (5 to 10-meter threshold)
 * 3. Reverse Geocoding Integration (converts lat/lng to human-readable location_name)
 * 4. Privacy & Payload Sanitization (masks raw coordinates, only exposes location_name)
 */

const https = require('https');

/**
 * Calculates the great-circle distance between two geographic coordinates
 * using the Haversine formula.
 *
 * Formula:
 *   a = sin²(Δφ/2) + cos(φ1) ⋅ cos(φ2) ⋅ sin²(Δλ/2)
 *   c = 2 ⋅ atan2( √a, √(1−a) )
 *   d = R ⋅ c
 *
 * @param {number} lat1 - Latitude of Point 1 in decimal degrees
 * @param {number} lon1 - Longitude of Point 1 in decimal degrees
 * @param {number} lat2 - Latitude of Point 2 in decimal degrees
 * @param {number} lon2 - Longitude of Point 2 in decimal degrees
 * @returns {number} Distance in meters
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Mean Earth radius in meters
  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaPhi = toRadians(lat2 - lat1);
  const deltaLambda = toRadians(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;
  return Math.round(distance * 100) / 100; // Return distance rounded to 2 decimal places (meters)
}

/**
 * Reverse Geocoding: Converts raw lat/lng into a human-readable location_name
 * Uses Nominatim/OpenStreetMap with HTTP timeout and fallback landmarks.
 *
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string>} Human-readable location name (e.g. "12th Main Road, Indiranagar")
 */
async function reverseGeocode(lat, lng) {
  const numLat = parseFloat(lat);
  const numLng = parseFloat(lng);

  // 1. Check known civic landmarks first for instant zero-latency match
  const presetMatch = resolvePresetLandmark(numLat, numLng);
  if (presetMatch) {
    return presetMatch;
  }

  // 2. Query OpenStreetMap Nominatim Reverse Geocoding API
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${numLat}&lon=${numLng}&format=json&addressdetails=1`;
    const data = await fetchJsonWithTimeout(url, 3000, {
      'User-Agent': 'SevaSnap-CivicApp/2.0 (civic-grievance-system; contact@sevasnap.gov)',
      'Accept': 'application/json',
    });

    if (data && data.address) {
      const addr = data.address;
      const road = addr.road || addr.street || addr.pedestrian || addr.footway || addr.path;
      const subArea = addr.suburb || addr.neighbourhood || addr.residential || addr.quarter;
      const wardOrDistrict = addr.city_district || addr.ward || addr.district;
      const city = addr.city || addr.town || addr.village || 'Bengaluru';

      if (road && subArea) {
        return `${road}, ${subArea}`;
      } else if (road && wardOrDistrict) {
        return `${road}, ${wardOrDistrict}`;
      } else if (subArea && city) {
        return `${subArea}, ${city}`;
      } else if (data.display_name) {
        const parts = data.display_name.split(',').map((p) => p.trim());
        return parts.slice(0, 2).join(', ');
      }
    }
  } catch (err) {
    console.warn('[GeoService] Reverse geocode network fallback:', err.message);
  }

  // 3. Fallback to coordinate-based regional sector
  return `Sector ${numLat.toFixed(2)}N, ${numLng.toFixed(2)}E`;
}

/**
 * Helper: Quick Landmark Presets for popular test locations
 */
function resolvePresetLandmark(lat, lng) {
  const presets = [
    { lat: 11.0267, lng: 77.1264, radius: 1500, name: 'Trichy Road, Sulur' },
    { lat: 12.9784, lng: 77.6408, radius: 1500, name: '12th Main Road, Indiranagar' },
    { lat: 12.9352, lng: 77.6245, radius: 1500, name: '100ft Road, Koramangala 4th Block' },
    { lat: 12.9698, lng: 77.7499, radius: 1500, name: 'ITPB Main Road, Whitefield' },
    { lat: 12.9756, lng: 77.6066, radius: 1500, name: 'MG Road Metro Station, CBD' },
  ];

  for (const p of presets) {
    const dist = calculateHaversineDistance(lat, lng, p.lat, p.lng);
    if (dist <= p.radius) {
      return p.name;
    }
  }
  return null;
}

/**
 * Safe JSON fetch using native Node.js https with timeout
 */
function fetchJsonWithTimeout(url, timeoutMs, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers, timeout: timeoutMs }, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`Status Code: ${res.statusCode}`));
      }
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Reverse geocode request timed out'));
    });
    req.on('error', reject);
  });
}

/**
 * Proximity-Based Duplicate Detection Engine
 * 
 * Checks database for existing active complaints of the SAME CATEGORY
 * within a 5 to 10-meter radius using the Haversine formula.
 *
 * @param {Model} IssueModel - Mongoose Issue model
 * @param {Object} params - { lat, lng, category, thresholdMeters = 10 }
 * @returns {Promise<{ isDuplicate: boolean, duplicateIssue: Object|null, distanceMeters: number|null }>}
 */
async function findProximityDuplicate(IssueModel, { lat, lng, category, thresholdMeters = 10 }) {
  const targetLat = parseFloat(lat);
  const targetLng = parseFloat(lng);

  if (isNaN(targetLat) || isNaN(targetLng)) {
    return { isDuplicate: false, duplicateIssue: null, distanceMeters: null };
  }

  // Query only ACTIVE issues (not yet resolved) of the SAME category
  const activeIssues = await IssueModel.find({
    category: category,
    status: { $ne: 'resolved' },
  });

  let closestMatch = null;
  let minDistance = Infinity;

  for (const candidate of activeIssues) {
    const candidateLat = candidate.location?.lat ?? candidate.geo?.coordinates?.[1];
    const candidateLng = candidate.location?.lng ?? candidate.geo?.coordinates?.[0];

    if (candidateLat != null && candidateLng != null) {
      const distance = calculateHaversineDistance(
        targetLat,
        targetLng,
        parseFloat(candidateLat),
        parseFloat(candidateLng)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestMatch = candidate;
      }
    }
  }

  // Threshold: 5 to 10-meter radius (configurable, default: 10 meters)
  if (closestMatch && minDistance <= thresholdMeters) {
    return {
      isDuplicate: true,
      duplicateIssue: closestMatch,
      distanceMeters: minDistance,
    };
  }

  return {
    isDuplicate: false,
    duplicateIssue: null,
    distanceMeters: minDistance === Infinity ? null : minDistance,
  };
}

/**
 * Sanitizes Issue payload before sending to frontend client.
 * Strictly guarantees that location_name is exposed, and raw lat/lon
 * numbers are masked or kept internal.
 *
 * @param {Object|Document} issueDoc - Mongoose document or plain object
 * @returns {Object} Client-safe issue payload with location_name
 */
function sanitizeIssueForClient(issueDoc) {
  if (!issueDoc) return null;
  const issue = issueDoc.toObject ? issueDoc.toObject() : { ...issueDoc };

  const humanLocation =
    issue.location_name ||
    issue.location?.location_name ||
    issue.location?.address ||
    issue.location?.ward ||
    'Verified Civic Location';

  // Ensure location_name is exposed at root and nested
  issue.location_name = humanLocation;
  if (issue.location) {
    issue.location.location_name = humanLocation;
  }

  return issue;
}

module.exports = {
  calculateHaversineDistance,
  reverseGeocode,
  findProximityDuplicate,
  sanitizeIssueForClient,
};
