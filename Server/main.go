package main

import (
	"log"
	"net/http"
	"github.com/gorilla/websocket"
)

var clients = make(map[*websocket.Conn] bool)	// connected clients
var broadcast = make(chan Message)					// broadcast channel
var upgrader = websocket.Upgrader{}					// upgrades HTTP reqs to websocket connections

type Message struct {
	Email			string `json:"email"`
	Username		string `json:"username"`
	Message		string `json:"message"`
}

func handleConnections(w http.ResponseWriter, r *http.Request) {
	// Upgrade the initial GET request to a websocket
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal("Upgrade", err)
	}

	// Close the websocket connection when the function returns
	defer ws.Close()

	// Register the client by adding to the clients map
	clients[ws] = true

	// Infinite loop to wait for messages from the client
	for {
		var msg Message
		// Serialize message from JSON to the Message object
		err := ws.ReadJSON(&msg)
		if err != nil {
			log.Printf("ERROR: %v", err)
			delete(clients, ws)
			break
		}
		// Send the newly recieved message to the broadcast channel
		broadcast <- msg
	}
}

func handleMessages() {
	for {
		// Get the next message in the broadcast channel
		msg := <-broadcast
		// Send the message out to every connected client
		for client := range clients {
			err := client.WriteJSON(msg)
			if err != nil {
				log.Printf("ERROR: %v", err)
				client.Close()
				delete(clients, client)
			}
		}
	}
}


func main() {

	// Create a file server
	fs := http.FileServer(http.Dir("../Public"))

	// Routes
	http.Handle("/", fs)
	// Create websocket route
	http.HandleFunc("/ws", handleConnections)

	// Start listening for incoming chat messages
	go handleMessages()

	log.Println("Server started on port 1337")
	err := http.ListenAndServe(":1337", nil)
	if err != nil {
		log.Fatal("ListenAndServe", err)
	}

}
