import { useEffect, useRef, useState } from "react";
import "./index.css";
import StarRating from "./StarRating";

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);
const KEY = "28aad991";

export default function App() {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState([]);

  const [watched, setWatched] = useState(() => {
    const storedValue = localStorage.getItem("watched");
    return storedValue ? JSON.parse(storedValue) : [];
  });

  function addWatchedMovieHandler(movie) {
    setWatched((watched) => [...watched, movie]);
  }

  function deleteMovieHandler(id) {
    setWatched(watched.filter((movie) => movie.imdbID !== id));
  }

  useEffect(
    function () {
      const controller = new AbortController();
      async function fetchMovies() {
        try {
          setIsLoading(true);
          setError("");
          const res = await fetch(
            `https://www.omdbapi.com/?apikey=${KEY}&s=${query}`,
            { signal: controller.signal }
          );

          if (!res.ok) {
            throw new Error("we lost coniction");
          }

          const data = await res.json();
          if (data.Response === "False") {
            throw new Error(data.Error);
          }

          setMovies(data.Search);
          console.log(data);
        } catch (err) {
          if (err.name !== "AbortError") setError(err.message);
        } finally {
          setIsLoading(false);
        }
      }
      if (query.length === 0) {
        setMovies([]);
        setError("");
        return;
      }

      fetchMovies();

      return function () {
        controller.abort();
      };
    },
    [query]
  );

  useEffect(
    function () {
      async function movieDetails() {
        const res = await fetch(
          `https://www.omdbapi.com/?apikey=${KEY}&i=${selectedId}`
        );
        const data = await res.json();
        console.log(data);
        setSelectedMovie(data);
      }
      movieDetails();
    },
    [selectedId]
  );

  useEffect(
    function () {
      localStorage.setItem("watched", JSON.stringify(watched));
    },
    [watched]
  );

  return (
    <>
      <NavBar>
        <Search setQuery={setQuery} query={query} />
        <NumResults movies={movies} />
      </NavBar>

      <Main movies={movies}>
        <Box>
          {isLoading && <Loader />}
          {!isLoading && !error && (
            <Movieslist
              movies={movies}
              setSelectedId={setSelectedId}
              selectedId={selectedId}
            />
          )}
          {error && <Error message={error} />}
        </Box>

        <Box>
          {selectedId ? (
            <MovieDetails
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              selectedMovie={selectedMovie}
              addWatchedMovieHandler={addWatchedMovieHandler}
              watched={watched}
            />
          ) : (
            <>
              <Summary watched={watched} />
              <WatchedMoviesList
                watched={watched}
                deleteMovieHandler={deleteMovieHandler}
              />
            </>
          )}
        </Box>
      </Main>
    </>
  );
}

function MovieDetails({
  selectedId,
  setSelectedId,
  selectedMovie,
  addWatchedMovieHandler,
  watched,
}) {
  const [userRating, setUserRating] = useState(0);

  const {
    Title: title,
    Poster: poster,
    Released: released,
    Runtime: runtime,
    imdbRating,
    Plot: plot,
    Actors: actors,
    Director: director,
  } = selectedMovie;

  const isWatched = watched?.map((movie) => movie.imdbID).includes(selectedId);

  const watchedRating = watched.find(
    (movie) => movie.imdbID === selectedId
  )?.userRating;

  function backHandler() {
    setSelectedId(null);
  }

  function handleAdd() {
    const newMovie = {
      imdbID: selectedId,
      title,
      poster,
      released,
      runtime: Number(runtime.split(" ").at(0)),
      imdbRating,
      plot,
      actors,
      director,
      userRating: userRating,
    };

    addWatchedMovieHandler(newMovie);
    setSelectedId(null);
  }

  useEffect(
    function () {
      if (!title) return;
      document.title = `Movie | ${title}`;

      return function () {
        document.title = "usePopcorn";
      };
    },
    [title]
  );

  return (
    <div className="details">
      <header>
        <button className="btn-back" onClick={backHandler}>
          &larr;
        </button>
        <img src={poster} alt="poster" />
        <div className="details-overview">
          <h2>{title}</h2>
          <p>
            {released} - {runtime}
          </p>
          <p>
            <span>⭐</span>
            {imdbRating} IMDB rating
          </p>
        </div>
      </header>

      <section>
        {isWatched ? (
          <div className="rating">
            you rated this movie with {watchedRating}⭐
          </div>
        ) : (
          <div className="rating">
            <StarRating maxRating={10} size={24} onSetRating={setUserRating} />
            {userRating > 0 && (
              <button className="btn-add" onClick={handleAdd}>
                add to list
              </button>
            )}
          </div>
        )}

        <p>
          <em>{plot}</em>
        </p>
        <p>Starring {actors}</p>
        <p>directed by{director}</p>
      </section>
    </div>
  );
}

function Error({ message }) {
  return (
    <p className="error">
      <span>⛔</span>
      {message}
    </p>
  );
}

function Loader() {
  return <p className="loader">LOADING...</p>;
}

function NavBar({ children }) {
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

function Search({ query, setQuery }) {
  const inputEl = useRef(null);

  useEffect(function () {
    inputEl.current.focus();
  }, []);
  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      ref={inputEl}
    />
  );
}

function NumResults({ movies }) {
  return (
    <p className="num-results">
      Found <strong>{movies.length}</strong> results
    </p>
  );
}

function Main({ children }) {
  return <main className="main">{children}</main>;
}

function Box({ children }) {
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

function Movieslist({ movies, setSelectedId, selectedId }) {
  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <Movies
          movie={movie}
          key={movie.imdbID}
          setSelectedId={setSelectedId}
          selectedId={selectedId}
        />
      ))}
    </ul>
  );
}

function Movies({ movie, setSelectedId, selectedId }) {
  function selectMovieHamdler() {
    setSelectedId(movie.imdbID);
    console.log(movie.imdbID);
    if (movie.imdbID === selectedId) {
      setSelectedId(null);
    }
  }
  return (
    <li onClick={selectMovieHamdler}>
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

function WatchedMoviesList({ watched, deleteMovieHandler }) {
  return (
    <>
      <ul className="list">
        {watched?.map((movie) => (
          <WatchedMovies
            movie={movie}
            key={movie.imdbID}
            deleteMovieHandler={deleteMovieHandler}
          />
        ))}
      </ul>
    </>
  );
}

function WatchedMovies({ movie, deleteMovieHandler }) {
  return (
    <li>
      <img src={movie.poster} alt={`${movie.title} poster`} />
      <h3>{movie.title}</h3>
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
          onClick={() => deleteMovieHandler(movie.imdbID)}
        >
          ❌
        </button>
      </div>
    </li>
  );
}
function Summary({ watched }) {
  const avgImdbRating = average(watched?.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched?.map((movie) => movie.userRating));
  const avgRuntime = average(watched?.map((movie) => movie.runtime));
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
          <span>{avgImdbRating.toFixed(1)}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime.toFixed(1)} min</span>
        </p>
      </div>
    </div>
  );
}
