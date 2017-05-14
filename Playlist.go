package main

//Playlist type
type Playlist struct {
	ID   int    `json:"id"` //converts to lower case when parsed to JSON
	Name string `json:"name"`
}

//Slice of playlists
type Playlists []Playlist
