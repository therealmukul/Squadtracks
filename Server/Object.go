package main

type UUIDResponse struct {
   Status         string `json:"status"`
   RoomUID        string `json:"roomUID"`
   ClientUID      string `json:"clientUID"`
}

type JoinRoomResponse struct {
   Status         string `json:"status"`
   ClientUID      string `json:"clientUID"`
   RoomName       string `json:"roomName"`
}
