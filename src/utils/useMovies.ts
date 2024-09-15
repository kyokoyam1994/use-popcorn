import { useEffect, useState } from "react";
import { API_KEY } from "../consts";

export function useMovies(query: string) {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchMovies() {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(
          `http://www.omdbapi.com/?apikey=${API_KEY}&s="${query}"`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Could not fetch movies");
        }

        const json = await response.json();

        if (json.Response === "False") {
          throw new Error("Could not find any movies");
        }

        setMovies(json.Search);
        setError("");
      } catch (e) {
        if (e.name !== "AbortError") {
          console.log(e);
          setError(e.message);
        }
      } finally {
        setIsLoading(false);
      }
    }

    if (query.length < 3) {
      setMovies([]);
      setError("");
      return;
    }

    fetchMovies();
    return () => controller.abort();
  }, [query]);

  return { movies, isLoading, error };
}
