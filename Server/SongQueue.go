package main

type SongQueue struct {
	CurrentSongQueueIndex int         `json:"currentSongQueueIndex"`
	CurrentSongID         string      `json:"currentSongID"`
	Queue                 []QueueItem `json:"queue"`
}
