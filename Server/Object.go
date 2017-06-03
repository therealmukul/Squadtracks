package main

type UUIDResponse struct {
   Status         string `json:"status"`
   RoomUID        string `json:"roomUID"`
   ClientUID      string `json:"clientUID"`
}
