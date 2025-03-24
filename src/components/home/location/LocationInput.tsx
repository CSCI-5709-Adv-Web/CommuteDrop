"use client";

import type React from "react";
import { useState, useCallback, useEffect, useRef } from "react";
import { Loader, X, Crosshair } from "lucide-react";
import { mapService } from "../../../services/map-service";
import LocationSuggestions from "./LocationSuggestions";

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  onCoordinatesChange: (
    coordinates: { lat: number; lng: number } | undefined
  ) => void;
  placeholder: string;
  icon: React.ReactNode;
  type: "pickup" | "dropoff";
}

export default function LocationInput({
  value,
  onChange,
  onCoordinatesChange,
  placeholder,
  icon,
  type,
}: LocationInputProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSuggestions = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      try {
        setIsLoading(true);

        let locationBias = undefined;
        try {
          const position = await new Promise<GeolocationPosition>(
            (resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0,
              });
            }
          );

          locationBias = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
        } catch (error) {
          // Continue without location bias
        }

        const language = "en";
        const suggestions = await mapService.getAddressSuggestions(
          text,
          5,
          language,
          locationBias
        );

        const formattedSuggestions = Array.isArray(suggestions)
          ? suggestions.map((suggestion) => ({
              placeId: suggestion.placeId || "",
              description: suggestion.description || suggestion.text || "",
              mainText:
                suggestion.mainText ||
                suggestion.text ||
                suggestion.description ||
                "",
              secondaryText: suggestion.secondaryText || "",
            }))
          : [];

        setSuggestions(formattedSuggestions);
      } catch (error) {
        console.error(`Error fetching ${type} suggestions:`, error);
      } finally {
        setIsLoading(false);
      }
    },
    [type]
  );

  const handleGetCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    try {
      setIsGettingLocation(true);

      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        }
      );

      const { latitude, longitude } = position.coords;
      onCoordinatesChange({ lat: latitude, lng: longitude });

      try {
        const result = await mapService.geocodeAddress(
          `${latitude},${longitude}`
        );
        if (result && result.formattedAddress) {
          onChange(result.formattedAddress);
          if (inputRef.current) {
            inputRef.current.focus();
          }
        } else {
          onChange(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        }
      } catch (error) {
        onChange(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      }
    } catch (error) {
      alert(
        "Could not get your current location. Please check your permissions and try again."
      );
    } finally {
      setIsGettingLocation(false);
    }
  }, [onChange, onCoordinatesChange]);

  const handleInputChange = useCallback(
    (newValue: string) => {
      onChange(newValue);

      if (newValue.trim()) {
        setShowSuggestions(true);

        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        // Shorter debounce for better responsiveness
        debounceTimerRef.current = setTimeout(() => {
          fetchSuggestions(newValue);

          // If the input looks like a complete address, try to geocode it immediately
          if (newValue.length > 10 && newValue.includes(" ")) {
            const province = "Nova Scotia";
            setIsLoading(true);
            mapService
              .geocodeAddress(newValue, province)
              .then((result) => {
                if (result && result.latitude !== 0 && result.longitude !== 0) {
                  onCoordinatesChange({
                    lat: result.latitude,
                    lng: result.longitude,
                  });
                }
              })
              .catch((err) => {
                console.error(`Error geocoding ${type} address:`, err);
              })
              .finally(() => {
                setIsLoading(false);
              });
          }
        }, 300);
      } else {
        setShowSuggestions(false);
        setSuggestions([]);
        onCoordinatesChange(undefined);
      }
    },
    [onChange, onCoordinatesChange, fetchSuggestions, type]
  );

  const handleBlur = useCallback(() => {
    if (value && value.trim().length > 0) {
      const province = "Nova Scotia";
      setIsLoading(true);
      mapService
        .geocodeAddress(value, province)
        .then((result) => {
          if (result && result.latitude !== 0 && result.longitude !== 0) {
            onCoordinatesChange({
              lat: result.latitude,
              lng: result.longitude,
            });
          }
        })
        .catch((err) => {
          console.error(`Error geocoding ${type} address on blur:`, err);
        })
        .finally(() => {
          setIsLoading(false);
          setTimeout(() => setShowSuggestions(false), 200);
        });
    } else {
      setTimeout(() => setShowSuggestions(false), 200);
    }
  }, [value, type, onCoordinatesChange]);

  const handleSuggestionSelect = useCallback(
    (suggestion: any) => {
      const address = suggestion.description || suggestion.mainText || "";
      onChange(address);
      setShowSuggestions(false);
      setIsLoading(true);

      const province = "Nova Scotia";
      mapService
        .geocodeAddress(address, province)
        .then((result) => {
          if (result && result.latitude !== 0 && result.longitude !== 0) {
            onCoordinatesChange({
              lat: result.latitude,
              lng: result.longitude,
            });
          } else {
            console.error(
              `Failed to get valid coordinates for ${type} address:`,
              address
            );
          }
        })
        .catch((err) => {
          console.error(`Error geocoding ${type} address:`, err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    },
    [onChange, onCoordinatesChange, type]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const suggestionsContainer = document.getElementById(
        `${type}-suggestions-container`
      );

      if (suggestionsContainer && !suggestionsContainer.contains(target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [type]);

  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2">{icon}</div>
      <input
        ref={inputRef}
        className="w-full p-4 pl-8 pr-20 bg-gray-50 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        aria-label={placeholder}
        onFocus={() => value.length > 2 && setShowSuggestions(true)}
      />

      <button
        type="button"
        onClick={handleGetCurrentLocation}
        disabled={isGettingLocation}
        className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary p-1 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Use my current location"
        title="Use my current location"
      >
        <Crosshair
          size={16}
          className={isGettingLocation ? "animate-pulse" : ""}
        />
      </button>

      {value && (
        <button
          onClick={() => handleInputChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
          aria-label={`Clear ${type} location`}
        >
          <X size={16} />
        </button>
      )}

      <div
        className="absolute right-20 top-1/2 -translate-y-1/2"
        style={{
          display: isLoading || isGettingLocation ? "block" : "none",
        }}
      >
        <Loader
          className="w-4 h-4 text-gray-400 animate-spin"
          aria-hidden="true"
        />
      </div>

      {showSuggestions && (
        <LocationSuggestions
          id={`${type}-suggestions-container`}
          suggestions={suggestions}
          isLoading={isLoading}
          searchText={value}
          onSelect={handleSuggestionSelect}
        />
      )}
    </div>
  );
}
