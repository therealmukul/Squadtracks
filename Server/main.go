package main

import (
	"log"
	"net/http"
	"encoding/json"
	"github.com/gorilla/websocket"
	"github.com/gorilla/mux"
	"github.com/nu7hatch/gouuid"
)

// var clients = make(map[string] Room)
var clients = make(map[string][]*websocket.Conn) // {<roomID> : [clients]}
var broadcast = make(chan Action)                // broadcast channel
var upgrader = websocket.Upgrader{}              // upgrades HTTP reqs to websocket connections

type Room struct {
	RoomID					string
	RoomName					string
	ConnectedClients 		[]Client
}

func handleConnections(w http.ResponseWriter, r *http.Request) {
	// Upgrade the initial GET request to a websocket
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal("Upgrade", err)
	}

	// Create the client object
	var client Client
	errClient := ws.ReadJSON(&client)
	if errClient != nil {
		log.Printf("ERROR: %v", errClient)

	} else {
		// Register the client by adding to the clients map
		clients[client.RoomID] = append(clients[client.RoomID], ws)
		log.Println(clients)
	}

	// Close the websocket connection when the function returns
	defer ws.Close()

	// Infinite loop to wait for messages from the client
	for {
		var msg Action
		// Serialize message from JSON to the Song object
		errMsg := ws.ReadJSON(&msg)
		if errMsg != nil {
			log.Printf("ERROR: %v", errMsg)
			break
		}
		log.Println(msg)
		// Send the newly recieved message to the broadcast channel
		broadcast <- msg
	}
}

func handleMessages() {
	for {
		// Get the next message in the broadcast channel
		msg := <-broadcast
		// Send the message out to every connected client
		for _, client := range clients[msg.RoomID] {
			err := client.WriteJSON(msg)
			if err != nil {
				log.Printf("ERROR: %v", err)
			}
		}
		// for client := range clients {
		// 	err := client.WriteJSON(msg)
		// 	if err != nil {
		// 		log.Printf("ERROR: %v", err)
		// 		client.Close()
		// 		delete(clients, client)
		// 	}
		// }
	}
}

func generateUuid(w http.ResponseWriter, r *http.Request) {
	u, err := uuid.NewV4()
	uid := u.String()
	if err != nil {
		log.Printf("ERROR: %v", err)
		uuid := UUIDResponse{"ERROR", "ERROR"}
		js, err := json.Marshal(uuid)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
    		return
		}
		w.Header().Set("Content-Type", "application/json")
  		w.Write(js)
	} else {
		log.Printf(uid)
		uuid := UUIDResponse{"OK", uid}
		js, err := json.Marshal(uuid)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
    		return
		}
		w.Header().Set("Content-Type", "application/json")
  		w.Write(js)
	}
}

func main() {

	// Create a file server
	fs := http.FileServer(http.Dir("../Public"))

	// Create Gorilla Mux Router
	r := mux.NewRouter()
	
	r.HandleFunc("/ws", handleConnections)
	r.HandleFunc("/api/genuuid", generateUuid)
	r.PathPrefix("/").Handler(fs)
	http.Handle("/", r)

	// Start listening for incoming chat messages
	go handleMessages()

	log.Println("Server started on port 1337")
	err := http.ListenAndServe(":1337", nil)
	if err != nil {
		log.Fatal("ListenAndServe", err)
	}

}
