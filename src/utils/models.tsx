export interface MovieData {
  imdbID: string;
  Title: string;
  Year: string;
  Poster: string;
}

export interface WatchedMovieData extends MovieData {
  runtime: number;
  imdbRating: number;
  userRating: number;
}
