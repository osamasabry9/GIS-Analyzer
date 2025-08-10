"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { MapPinIcon, SearchIcon, XIcon } from "lucide-react";

type MapboxFeature = {
  id: string;
  place_name: string;
  center: [number, number];
  bbox?: [number, number, number, number];
};

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

export default function SearchBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MapboxFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastReqId = useRef(0);

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Debounced Mapbox API search with abort
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      const reqId = ++lastReqId.current;

      setIsLoading(true);

      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5`;

        const res = await fetch(url, { signal: ac.signal });
        if (!res.ok) throw new Error(`Geocoder error ${res.status}`);
        const data = await res.json();

        if (reqId === lastReqId.current) {
          const features = Array.isArray(data.features) ? data.features : [];
          setResults(features);
          setIsOpen(features.length > 0);
          setSelectedIndex(-1);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Mapbox geocoding error:", err);
          setResults([]);
          setIsOpen(false);
          setSelectedIndex(-1);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      abortRef.current?.abort();
    };
  }, [query]);

  function handleResultSelect(place: MapboxFeature) {
    const [lng, lat] = place.center;
    document.dispatchEvent(
      new CustomEvent("gis:flyto", {
        detail: {
          lng,
          lat,
          zoom: 14,
          dropMarker: true,
          name: place.place_name,
        },
      })
    );
    setIsOpen(false);
    setQuery(place.place_name);
    setSelectedIndex(-1);
  }

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || results.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, -1));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0) {
            handleResultSelect(results[selectedIndex]);
          }
          break;
        case "Escape":
          setIsOpen(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    },
    [isOpen, results, selectedIndex]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(-1);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div
      ref={searchRef}
      className="relative w-80"
    >
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <div className="animate-spin h-4 w-4 text-gray-400">
              <SearchIcon />
            </div>
          ) : (
            <SearchIcon className="h-4 w-4 text-gray-400" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Search for places..."
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoComplete="off"
          spellCheck={false}
        />

        {query && !isLoading && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            aria-label="Clear search"
          >
            <XIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {results.map((result, index) => (
            <button
              key={result.id}
              onClick={() => handleResultSelect(result)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 ${
                index === selectedIndex ? "bg-blue-50 dark:bg-blue-900/20" : ""
              }`}
              type="button"
            >
              <MapPinIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-900 dark:text-white truncate">
                {result.place_name}
              </span>
            </button>
          ))}
        </div>
      )}

      {isOpen && results.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 text-center text-gray-500 dark:text-gray-400">
          No results
        </div>
      )}
    </div>
  );
}
