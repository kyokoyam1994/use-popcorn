import { useEffect, useRef, useState } from "react";
import { useMovies } from "./utils/useMovies";
import { API_KEY } from "./consts";
import StarRating from "./StarRating";
import { WatchedMovieData, MovieData } from "./utils/models";
import { useLocalStorageState } from "./utils/useLocalStorageState";
import { useKey } from "./utils/useKey";

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

export default function App() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { movies, isLoading, error } = useMovies(query);

  const [watched, setWatched] = useLocalStorageState<WatchedMovieData[]>(
    [],
    "watched"
  );

  function handleMovieSelected(id: string) {
    setSelectedId((selectedId) => (id !== selectedId ? id : null));
  }

  function handleMovieDeselected() {
    setSelectedId(null);
  }

  function handleAddWatched(movie: WatchedMovieData) {
    setWatched((watched: WatchedMovieData[]) => [...watched, movie]);
  }

  function handleDeleteWatched(id: string) {
    setWatched((watched: WatchedMovieData[]) =>
      watched.filter((w) => w.imdbID !== id)
    );
  }

  return (
    <>
      <NavBar>
        <Search query={query} setQuery={setQuery} />
        <NumResults movies={movies} />
      </NavBar>

      <Main>
        <Box>
          {isLoading ? (
            <Loader />
          ) : error ? (
            <ErrorMessage message={error} />
          ) : (
            <MovieList movies={movies} onMovieSelected={handleMovieSelected} />
          )}
        </Box>
        <Box>
          {selectedId ? (
            <MovieDetails
              selectedId={selectedId}
              watchedMovies={watched}
              onMovieDeselected={handleMovieDeselected}
              onAddWatched={handleAddWatched}
            />
          ) : (
            <>
              <WatchedSummary watched={watched}></WatchedSummary>
              <WatchedMoviesList
                watched={watched}
                onWatchedSummaryDeleted={handleDeleteWatched}
              ></WatchedMoviesList>
            </>
          )}
        </Box>
      </Main>
    </>
  );
}

function Loader() {
  return <p className="loader">Loading...</p>;
}

interface ErrorMessageProps {
  message: string;
}

function ErrorMessage({ message }: ErrorMessageProps) {
  return <p className="error">{message}</p>;
}

interface NavBarProps {
  children: React.ReactNode;
}

function NavBar({ children }: NavBarProps) {
  return (
    <nav className="nav-bar">
      <Logo />
      {children}
    </nav>
  );
}

function Logo() {
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>usePopcorn</h1>
    </div>
  );
}

interface NumResults {
  movies: MovieData[];
}

function NumResults({ movies }: NumResults) {
  return (
    <p className="num-results">
      Found <strong>{movies.length}</strong> results
    </p>
  );
}

interface SearchProps {
  query: string;
  setQuery: (query: string) => void;
}

function Search({ query, setQuery }: SearchProps) {
  const inputElement = useRef<HTMLInputElement>(null);

  useKey("Enter", () => {
    if (document.activeElement === inputElement.current) {
      return;
    }
    inputElement.current?.focus();
    setQuery("");
  });

  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      ref={inputElement}
    />
  );
}

interface MainProps {
  children: React.ReactNode;
}

function Main({ children }: MainProps) {
  return <main className="main">{children}</main>;
}

interface BoxProps {
  children: React.ReactNode;
}

function Box({ children }: BoxProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="box">
      <button className="btn-toggle" onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? "–" : "+"}
      </button>
      {isOpen && children}
    </div>
  );
}

interface MovieListProps {
  movies: MovieData[];
  onMovieSelected: (id: string) => void;
}

function MovieList({ movies, onMovieSelected }: MovieListProps) {
  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <Movie
          key={movie.imdbID}
          movie={movie}
          onMovieSelected={onMovieSelected}
        ></Movie>
      ))}
    </ul>
  );
}

interface MovieProps {
  movie: MovieData;
  onMovieSelected: (id: string) => void;
}

function Movie({ movie, onMovieSelected }: MovieProps) {
  return (
    <li key={movie.imdbID} onClick={() => onMovieSelected(movie.imdbID)}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}

interface MovieDetailsProps {
  selectedId: string;
  watchedMovies: WatchedMovieData[];
  onMovieDeselected: () => void;
  onAddWatched: (movie: WatchedMovieData) => void;
}

function MovieDetails({
  selectedId,
  watchedMovies,
  onMovieDeselected,
  onAddWatched,
}: MovieDetailsProps) {
  const [movie, setMovie] = useState({});
  const [userRating, setUserRating] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    Title: title,
    Year: year,
    Poster: poster,
    Runtime: runtime,
    imdbRating,
    Plot: plot,
    Released: released,
    Actors: actors,
    Director: director,
    Genre: genre,
  } = movie;

  function handleAddWatched() {
    const watchedMovie: WatchedMovieData = {
      imdbID: selectedId,
      Title: title,
      Year: year,
      Poster: poster,
      imdbRating: Number(imdbRating),
      runtime: Number(runtime.split(" ").at(0)),
      userRating,
    };
    onAddWatched(watchedMovie);
    onMovieDeselected();
  }

  useKey("Escape", onMovieDeselected);

  useEffect(() => {
    async function getMovieDetails() {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(
          `http://www.omdbapi.com/?apikey=${API_KEY}&i=${selectedId}`
        );

        if (!response.ok) {
          throw new Error("Could not fetch movies");
        }

        const json = await response.json();
        setMovie(json);
      } catch (e) {
        console.error(e);
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    }
    getMovieDetails();
  }, [selectedId]);

  useEffect(() => {
    if (!title) return;
    document.title = `Movie | ${title}`;

    return () => {
      document.title = "Use Popcorn";
    };
  }, [title]);

  const watchedMovie = watchedMovies.find((w) => selectedId === w.imdbID);

  return (
    <div className="details">
      {isLoading ? (
        <Loader />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <>
          <header>
            <button className="btn-back" onClick={onMovieDeselected}>
              &larr;
            </button>
            <img src={poster} alt={`Poster of ${movie}`} />
            <div className="details-overview">
              <h2>{title}</h2>
              <p>
                {released} &bull; {runtime}
              </p>
              <p>{genre}</p>
              <p>
                <span>⭐</span>
                {imdbRating} IMDb rating
              </p>
            </div>
          </header>

          <section>
            <div className="rating">
              {!watchedMovie ? (
                <>
                  <StarRating
                    maxRating={10}
                    size={24}
                    onSetRating={setUserRating}
                  ></StarRating>
                  {userRating > 0 && (
                    <button className="btn-add" onClick={handleAddWatched}>
                      + Add To List
                    </button>
                  )}
                </>
              ) : (
                <p>
                  You gave this movie a rating of {watchedMovie.userRating} ⭐
                </p>
              )}
            </div>
            <p>
              <em>{plot}</em>
            </p>
            <p>Starring {actors}</p>
            <p>Directed by {director}</p>
          </section>
        </>
      )}
    </div>
  );
}

interface WatchedSummaryProps {
  watched: WatchedMovieData[];
}

function WatchedSummary({ watched }: WatchedSummaryProps) {
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.runtime));

  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating.toFixed(2)}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating.toFixed(2)}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>
            {avgRuntime % 1 == 0 ? avgRuntime : avgRuntime.toFixed(1)} min
          </span>
        </p>
      </div>
    </div>
  );
}

interface WatchedMoviesListProps {
  watched: WatchedMovieData[];
  onWatchedSummaryDeleted: (id: string) => void;
}

function WatchedMoviesList({
  watched,
  onWatchedSummaryDeleted,
}: WatchedMoviesListProps) {
  return (
    <ul className="list">
      {watched.map((movie) => (
        <WatchedMovie
          key={movie.imdbID}
          movie={movie}
          onWatchedSummaryDeleted={onWatchedSummaryDeleted}
        ></WatchedMovie>
      ))}
    </ul>
  );
}

interface WatchedMovieProps {
  movie: WatchedMovieData;
  onWatchedSummaryDeleted: (id: string) => void;
}

function WatchedMovie({ movie, onWatchedSummaryDeleted }: WatchedMovieProps) {
  return (
    <li key={movie.imdbID}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{movie.imdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.runtime} min</span>
        </p>
        <button
          className="btn-delete"
          onClick={() => onWatchedSummaryDeleted(movie.imdbID)}
        >
          X
        </button>
      </div>
    </li>
  );
}
