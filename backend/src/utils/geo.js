/**
 * Calculate distance between two GPS coordinates using the Haversine formula.
 * Returns distance in meters.
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000 // Earth's radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

export const isWithinCampus = (studentLat, studentLng, campusLat, campusLng, radiusMeters) =>
  haversineDistance(studentLat, studentLng, campusLat, campusLng) <= radiusMeters

export function verifyCampusGeofence(studentLat, studentLng, campusLat = 19.0330, campusLng = 73.0297, radiusMeters = 200) {
  const distance = haversineDistance(Number(studentLat), Number(studentLng), Number(campusLat), Number(campusLng))
  const isAllowed = distance <= radiusMeters
  return {
    isAllowed,
    distance: Math.round(distance),
    radiusMeters,
    campusCoordinates: { lat: campusLat, lng: campusLng }
  }
}
