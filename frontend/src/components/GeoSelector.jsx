import { indiaGeo } from "../data/indiaGeo";

export default function GeoSelector({ selection, onChange }) {
  const states = indiaGeo.map((item) => item.state);
  const selectedState = indiaGeo.find((item) => item.state === selection.state);
  const cities = selectedState ? selectedState.cities : [];
  const selectedCity = cities.find((item) => item.name === selection.city);
  const areas = selectedCity ? selectedCity.areas : [];

  function handleCountryChange(value) {
    onChange({
      country: value,
      state: null,
      city: null,
      area: null,
    });
  }

  function handleStateChange(value) {
    onChange({
      ...selection,
      state: value || null,
      city: null,
      area: null,
    });
  }

  function handleCityChange(value) {
    onChange({
      ...selection,
      city: value || null,
      area: null,
    });
  }

  function handleAreaChange(value) {
    onChange({
      ...selection,
      area: value || null,
    });
  }

  return (
    <div className="geo-selector">
      <select
        value={selection.country || ""}
        onChange={(e) => handleCountryChange(e.target.value)}
      >
        <option value="">Select Country</option>
        <option value="India">India</option>
      </select>

      <select
        value={selection.state || ""}
        onChange={(e) => handleStateChange(e.target.value)}
        disabled={!selection.country}
      >
        <option value="">Select State</option>
        {states.map((state) => (
          <option key={state} value={state}>
            {state}
          </option>
        ))}
      </select>

      <select
        value={selection.city || ""}
        onChange={(e) => handleCityChange(e.target.value)}
        disabled={!selection.state}
      >
        <option value="">Select City</option>
        {cities.map((city) => (
          <option key={city.name} value={city.name}>
            {city.name}
          </option>
        ))}
      </select>

      <select
        value={selection.area || ""}
        onChange={(e) => handleAreaChange(e.target.value)}
        disabled={!selection.city}
      >
        <option value="">Select Area</option>
        {areas.map((area) => (
          <option key={area} value={area}>
            {area}
          </option>
        ))}
      </select>
    </div>
  );
}
