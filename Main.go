package main

import (
	"log"
	"net/http"
)

func main() {
	// Create a new router object and add router and their handler functions
	router := NewRouter()

	//Start the server on given port
	log.Fatal(http.ListenAndServe(":1337", router))
}
