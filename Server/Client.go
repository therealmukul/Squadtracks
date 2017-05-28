package main

import "github.com/gorilla/websocket"

type Client struct {
	RoomID     string
	Connection *websocket.Conn
}
