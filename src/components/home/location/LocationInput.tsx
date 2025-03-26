"use client";

import type React from "react";
import { useState, useCallback, useEffect, useRef } from "react";
import { Loader, X } from "lucide-react";
import { mapService } from "../../../services/map-service";
import LocationSuggestions from "./LocationSuggestions";
import { useDebounce } from "../../../hooks/useDebounce";

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
  type,
}: LocationInputProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const ignoreNextDebounceRef = useRef(false);
  // Add a new focusState to track when the input is focused
  const [isFocused, setIsFocused] = useState(false);

  // Debounce the input value
  const debouncedValue = useDebounce(value, 300);

  // Fetch suggestions handler
  const fetchSuggestions = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      try {
        setIsLoading(true);
        const suggestions = await mapService.getAddressSuggestions(text);
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

  // Improve the debouncing logic in the useEffect hook
  useEffect(() => {
    if (ignoreNextDebounceRef.current) {
      ignoreNextDebounceRef.current = false;
      return;
    }

    // Only fetch suggestions if the input is at least 3 characters
    if (debouncedValue.trim().length > 2) {
      fetchSuggestions(debouncedValue);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedValue, fetchSuggestions]);

  // Update the handleInputChange function to clear coordinates when input is cleared
  const handleInputChange = useCallback(
    (newValue: string) => {
      onChange(newValue);
      if (!newValue.trim()) {
        setShowSuggestions(false);
        setSuggestions([]);
        onCoordinatesChange(undefined);
      }
      // Don't trigger geocoding here - only update the text value
    },
    [onChange, onCoordinatesChange]
  );

  // Suggestion selection handler - this is where we'll do the geocoding
  const handleSuggestionSelect = useCallback(
    (suggestion: any) => {
      const address = suggestion.description || suggestion.mainText || "";
      // Update input value and hide suggestions
      setShowSuggestions(false);
      setSuggestions([]);
      onChange(address);
      // Flag to ignore next debounce trigger
      ignoreNextDebounceRef.current = true;

      // Only geocode when a suggestion is selected
      if (suggestion.placeId) {
        setIsLoading(true);
        mapService
          .geocodeAddress(address)
          .then((result) => {
            if (result?.latitude && result?.longitude) {
              onCoordinatesChange({
                lat: result.latitude,
                lng: result.longitude,
              });
            } else {
              console.error(`Invalid coordinates for ${type}:`, address);
              onCoordinatesChange(undefined);
            }
          })
          .catch((err) => {
            console.error(`Error geocoding ${type}:`, err);
            onCoordinatesChange(undefined);
          })
          .finally(() => {
            setIsLoading(false);
            inputRef.current?.blur();
          });
      } else {
        // If no placeId, just blur the input without geocoding
        inputRef.current?.blur();
      }
    },
    [onChange, onCoordinatesChange, type]
  );

  // Click outside handler
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [type]);

  // Update the return statement to include onFocus and onBlur handlers
  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2">
        {type === "pickup" ? (
          <div className="w-2 h-2 bg-black rounded-full" />
        ) : (
          <div className="w-2 h-2 border-2 border-black rounded-full" />
        )}
      </div>
      <input
        ref={inputRef}
        className="w-full p-4 pl-8 pr-10 bg-gray-50 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-black"
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          // Use setTimeout to allow click events on suggestions to fire before hiding them
          setTimeout(() => setIsFocused(false), 200);
        }}
      />
      {/* Clear input button */}
      {value && (
        <button
          onClick={() => {
            // Clear input and coordinates
            handleInputChange("");
            onCoordinatesChange(undefined);

            // Force a re-render of the map component
            setTimeout(() => {
              window.dispatchEvent(new Event("resize"));
            }, 100);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
          aria-label={`Clear ${type} location`}
        >
          <X size={16} />
        </button>
      )}
      {/* Loading indicator */}
      <div
        className="absolute right-10 top-1/2 -translate-y-1/2"
        style={{ display: isLoading ? "block" : "none" }}
      >
        <Loader
          className="w-4 h-4 text-gray-400 animate-spin"
          aria-hidden="true"
        />
      </div>
      {/* Suggestions list - only show when focused AND we have suggestions */}
      {isFocused && showSuggestions && suggestions.length > 0 && (
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
