package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
)

//Index route handler function
func Index(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "Welcome!")
}

//Playlists router handler function
func PlaylistsIndex(w http.ResponseWriter, r *http.Request) {

	//Populate the slice of playlists
	playlists := Playlists{
		Playlist{ID: 1, Name: "Rock"},
		Playlist{ID: 2, Name: "Pop"},
	}

	//Sending back our content type and telling the client to expect JSON
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	//Setting the status code
	w.WriteHeader(http.StatusOK)
	//Encode to JSON and serve
	if err := json.NewEncoder(w).Encode(playlists); err != nil {
		panic(err)
	}
}

//Playlists/id router handler function
func PlaylistShow(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	playlistId := vars["playlistId"]
	fmt.Fprintln(w, "Playlist Show:", playlistId)
}
