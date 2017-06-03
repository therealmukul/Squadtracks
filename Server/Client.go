package main

import "github.com/gorilla/websocket"

type Client struct {
   RoomID     	string `json:"roomID"`
	ClientID		string `json:"clientID"`
   RoomName    string `json:"roomName"`
	Connection 	*websocket.Conn `json:"connection"`
}
