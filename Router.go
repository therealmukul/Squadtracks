package main

//Return a mux router configured with the routes in the router slice
import (
	"net/http"

	"github.com/gorilla/mux"
)

func NewRouter() *mux.Router {
	//Create a new mux router
	router := mux.NewRouter().StrictSlash(true)
	//For each route in routes slice, configure a route in the mux router
	for _, route := range routes {
		var handler http.Handler

		handler = route.HandlerFunc
		handler = Logger(handler, route.Name)

		router.
			Methods(route.Method).
			Path(route.Pattern).
			Name(route.Name).
			Handler(handler)
	}

	return router
}
