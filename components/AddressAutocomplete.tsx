"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

export interface ParsedAddress {
  addressLine1: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  lat?: number;
  lng?: number;
}

interface Props {
  onAddressSelect: (address: ParsedAddress) => void;
  placeholder?: string;
  defaultValue?: string;
  className?: string;
}

let loadPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return Promise.reject(new Error("no key"));
  if (!loadPromise) {
    setOptions({ key: apiKey });
    loadPromise = importLibrary("places").then(() => {});
  }
  return loadPromise;
}

function parseComponents(components: google.maps.GeocoderAddressComponent[]): ParsedAddress {
  const get = (type: string, short = false) =>
    components.find(c => c.types.includes(type))?.[short ? "short_name" : "long_name"] ?? "";

  const streetNumber = get("street_number");
  const route = get("route");
  return {
    addressLine1: [streetNumber, route].filter(Boolean).join(" "),
    city: get("locality") || get("sublocality_level_1"),
    province: get("administrative_area_level_1", true),
    postalCode: get("postal_code"),
    country: get("country"),
  };
}

export default function AddressAutocomplete({
  onAddressSelect,
  placeholder = "Start typing an address…",
  defaultValue = "",
  className = "",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [ready, setReady] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [manual, setManual] = useState<ParsedAddress>({
    addressLine1: "", city: "", province: "", postalCode: "", country: "Canada",
  });

  const initAutocomplete = useCallback(() => {
    if (!inputRef.current || !window.google?.maps?.places) return;
    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      componentRestrictions: { country: ["ca", "us"] },
      fields: ["address_components", "geometry", "formatted_address"],
    });
    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (!place.address_components) return;
      const parsed = parseComponents(place.address_components);
      parsed.lat = place.geometry?.location?.lat();
      parsed.lng = place.geometry?.location?.lng();
      setValue(place.formatted_address ?? parsed.addressLine1);
      onAddressSelect(parsed);
    });
  }, [onAddressSelect]);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      setUseFallback(true);
      return;
    }
    loadGoogleMaps()
      .then(() => setReady(true))
      .catch(() => setUseFallback(true));
  }, []);

  useEffect(() => {
    if (ready) initAutocomplete();
  }, [ready, initAutocomplete]);

  const baseClass = className || "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none";

  if (useFallback) {
    return (
      <div className="space-y-2">
        {(["addressLine1", "city", "province", "postalCode", "country"] as const).map(field => (
          <input
            key={field}
            type="text"
            value={manual[field]}
            onChange={e => {
              const updated = { ...manual, [field]: e.target.value };
              setManual(updated);
              onAddressSelect(updated);
            }}
            placeholder={
              field === "addressLine1" ? "Street address" :
              field === "city" ? "City" :
              field === "province" ? "Province / State" :
              field === "postalCode" ? "Postal code" : "Country"
            }
            className={baseClass}
          />
        ))}
      </div>
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={e => setValue(e.target.value)}
      placeholder={placeholder}
      className={baseClass}
      autoComplete="off"
    />
  );
}
