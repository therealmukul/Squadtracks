package main

type Action struct {
	RoomID   		string    `json:"roomID"`
	VideoID  		string    `json:"videoID"`
	VideoTitle		string	 `json:"videoTitle"`
	User     		string    `json:"user"`
	Action   		string    `json:"action"`
	Data     		[]string  `json:"data"`
	SngQueue 		SongQueue `json:"songQueue"`
}
