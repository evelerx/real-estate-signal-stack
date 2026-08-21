def compute_confidence(final_score, analyst_delta, risk_deduction):
    volatility = abs(analyst_delta) * 50 + risk_deduction * 2

    confidence = max(100 - volatility, 40)

    band = {
        "lower": round(final_score - volatility * 0.3, 2),
        "upper": round(final_score + volatility * 0.3, 2),
    }

    return {
        "confidence_score": round(confidence, 1),
        "volatility": round(volatility, 2),
        "confidence_band": band,
    }
