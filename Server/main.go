package main

import (
	"log"
	"net/http"
	"github.com/gorilla/websocket"
)

var clients = make(map[string][]*websocket.Conn)	// {<roomID> : [clients]}
var broadcast = make(chan Action)					// broadcast channel
var upgrader = websocket.Upgrader{}					// upgrades HTTP reqs to websocket connections

type Action struct {
	RoomID		string `json:"roomID"`
	VideoID		string `json:"videoID"`
	User			string `json:"user"`
	Action		string `json:"action"`
	Data			[]string `json:"data"`
	SngQueue 		SongQueue `json:"songQueue"`
}

type SongQueue struct {
	CurrentSongQueueIndex	int `json:"currentSongQueueIndex"`
	CurrentSongID 				string `json:"currentSongID"`
	Queue							[]QueueItem `json:"queue"`
}

type QueueItem struct {
	User	string	`json:"user"`
	VideoID	string	`json:"videoID"`
}

type Client struct {
	RoomID string
	Connection *websocket.Conn
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
