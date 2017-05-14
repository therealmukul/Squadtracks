package main

import (
	"net/http"
)

/*
Route type
Name = Page Namge
Method = HTTP method
Pattern = URL
HandlerFucn = handler function
*/
type Route struct {
	Name        string
	Method      string
	Pattern     string
	HandlerFunc http.HandlerFunc
}

//Slice of routes
type Routes []Route

//Create three routes and append to router slice
var routes = Routes{
	Route{
		"Index",
		"GET",
		"/",
		Index,
	},
	Route{
		"PlaylistIndex",
		"GET",
		"/playlists",
		PlaylistsIndex,
	},
	Route{
		"TodoShow",
		"GET",
		"/playlists/{playlistId}",
		PlaylistShow,
	},
}
