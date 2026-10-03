"""Haversine distance helper for geofence calculations."""

import math


def haversine_distance(lat1, lng1, lat2, lng2):
    """Return the distance in metres between two GPS coordinates.

    Uses the Haversine formula with Earth radius 6 371 000 m.
    All arguments may be float, str or Decimal; they are cast to float
    internally.
    """
    R = 6_371_000  # Earth radius in metres

    phi1 = math.radians(float(lat1))
    phi2 = math.radians(float(lat2))
    delta_phi = math.radians(float(lat2) - float(lat1))
    delta_lambda = math.radians(float(lng2) - float(lng1))

    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c
