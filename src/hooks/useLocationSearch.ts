import { useEffect, useState } from "react";
import type { Location } from "@/types/location";
import { locationRepository } from "@/data/repository";

export function useLocationSearch(query: string) {
  const [results, setResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    const handle = setTimeout(() => {
      locationRepository.search(trimmed).then((matches) => {
        if (!cancelled) {
          setResults(matches);
          setIsSearching(false);
        }
      });
    }, 140);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query]);

  return { results, isSearching };
}
