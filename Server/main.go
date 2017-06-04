package main

import (
	"log"
	"net/http"
	"encoding/json"
	"github.com/gorilla/websocket"
	"github.com/gorilla/mux"
	"github.com/nu7hatch/gouuid"
)

var clients = make(map[string]*Room)
var broadcast = make(chan Action)                // broadcast channel
var upgrader = websocket.Upgrader{}              // upgrades HTTP reqs to websocket connections

type Room struct {
	RoomID					string
	RoomName					string
	ConnectedClients 		map[string]*websocket.Conn
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
		// Determine if the user is joining an existing room or creating a new room
		if _, ok := clients[client.RoomID]; ok {
			// Joining room
			clients[client.RoomID].ConnectedClients[client.ClientID] = ws
		} else {
			// Creating room
			room := new(Room)
			room.RoomID = client.RoomID
			room.RoomName = client.RoomName
			room.ConnectedClients = make(map[string]*websocket.Conn)
			room.ConnectedClients[client.ClientID] = ws
			clients[room.RoomID] = room
		}
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

func userJoinedRoom(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	w.WriteHeader(http.StatusOK)
	log.Println(vars["roomID"])
}

func handleMessages() {
	for {
		// Get the next message in the broadcast channel
		msg := <-broadcast
		// Send the message out to every connected client
		for clientID, client := range clients[msg.RoomID].ConnectedClients {
			// log.Println(clientID)
			err := client.WriteJSON(msg)
			if err != nil {
				log.Printf("ERROR: %v", err)
				client.Close()
				delete(clients[msg.RoomID].ConnectedClients, clientID)
			}
		}
	}
}

func generateUuid(w http.ResponseWriter, r *http.Request) {
	rID, errR := uuid.NewV4()
	cID, errC := uuid.NewV4()

	roomUID := rID.String()
	clientUID := cID.String()

	if errR != nil && errC != nil {
		log.Printf("ERROR: %v", errR)
		log.Printf("ERROR: %v", errC)

		errRes := UUIDResponse{"ERROR", "ERROR", "ERROR"}
		js, err := json.Marshal(errRes)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		   return
		}
		w.Header().Set("Content-Type", "application/json")
	 	w.Write(js)
	} else {
		successRes := UUIDResponse{"OK", roomUID, clientUID}
		js, err := json.Marshal(successRes)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		   return
		}
		w.Header().Set("Content-Type", "application/json")
	 	w.Write(js)
	}
}

func joinRoom(w http.ResponseWriter, r *http.Request) {
	// Get room object based on roomID
	roomID := r.FormValue("roomID")
	room := clients[roomID]
	log.Println(room)

	// Generate random clientUID
	cID, errC := uuid.NewV4()
	clientUID := cID.String()

	log.Println(errC)

	// Create reponse object
	if room != nil {
		res := JoinRoomResponse{"OK", clientUID, room.RoomName}
		js, err := json.Marshal(res)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		   return
		}
		w.Header().Set("Content-Type", "application/json")
	 	w.Write(js)
	} else {
		resErr := JoinRoomResponse{"Invalid Room", "ERROR", "ERROR"}
		js, err := json.Marshal(resErr)
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
	r.HandleFunc("/ws/{roomID}", userJoinedRoom)
	r.HandleFunc("/api/genuuid", generateUuid).Methods("GET")
	r.HandleFunc("/api/join", joinRoom).Methods("POST")
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
