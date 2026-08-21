def generate_heatmap_point(area_id, lat, lng, score, confidence):
    intensity = (score * 0.7) + (confidence * 0.3)

    return {
        "area": area_id,
        "lat": lat,
        "lng": lng,
        "intensity": round(intensity, 2),
    }
