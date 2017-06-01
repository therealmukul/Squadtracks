package main

import "github.com/gorilla/websocket"

type Client struct {
	ClientID		string
	RoomID     	string
	Connection 	*websocket.Conn
}
