var app = angular.module('UpNext', ['youtube-embed', 'ui.router']).run(function($rootScope, $state) {

});

app.controller('MainCtl', ['$scope', '$http', '$state', function($scope, $http, $state) {
   $scope.clientID = null;
   $scope.roomID = null;
   $scope.roomName = null;
   $scope.username = null;
   $scope.inviteLink = null;
   $scope.joined = false;
   $scope.songUrl = null;
   $scope.roomMembers = [];
   $scope.searchQuery = null;
   $scope.searchQueryResults = null;
   $scope.audioSpeakerUser = 'ALL';
   $scope.songThumbnails = [];


   // Player Attributes
   $scope.player = null;

   $scope.playerVars = {
      autoplay: 1,
      controls: 0,
      modestbranding: 1,
      rel: 0,
      showinfo: 0
   }

   $scope.songQueue = {
      currentSongQueueIndex: null,
      currentSongID: null,
      queue: []
   };

   $scope.config = {
      headers : {
         'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
      }
   }

   // Player ready event listener
   $scope.$on('youtube.player.ready', function($event, player) {
      console.log('player loaded');
      console.log($scope.audioSpeakerUser, $scope.username);
      if (($scope.audioSpeakerUser != 'ALL') && ($scope.audioSpeakerUser != $scope.username)) {
         player.mute();
      }
   });

   window.onbeforeunload = function () {
      return "";
   };

   // Establish a websocket connection
   var conn = new WebSocket("ws://" + window.location.host + "/ws");

   // When the client connection is terminated
   conn.onclose = function(e) {
      $scope.$apply(function() {
         console.log("WS Connection Closed");
         console.log($scope.username, $scope.clientID);
      });
   }

   // When the client connection is established
   conn.onopen = function(e) {
      $scope.$apply(function() {
         console.log("WS Connection Opened");
      });

   }

   // When the client receives a messages over the websocket
   conn.onmessage = function(e) {
      $scope.$apply(function() {
         // grab the message info
         var actionInfo = JSON.parse(e.data);
         console.log(actionInfo);
         // TODO: This code is sort of repetive. It can be further simplified.
         // Add Song
         if (actionInfo.action === 'addSong') {
            var queueItem = {user: actionInfo.user, videoID: actionInfo.videoID, videoTitle: actionInfo.videoTitle};
            $scope.songQueue.queue.push(queueItem);
            if ($scope.username != actionInfo.user) {
               var msg = actionInfo.user + ' added a song';
               Materialize.toast(msg, 2000, 'rounded');
            }

            // Setup song queue
            if ($scope.songQueue.queue.length === 1) {
               $scope.songQueue.currentSongQueueIndex = 0;
               $scope.songQueue.currentSongID = $scope.songQueue.queue[$scope.songQueue.currentSongQueueIndex].videoID;
            }

         // Pause player
         } else if (actionInfo.action === 'pause') {
            if ($scope.username != actionInfo.user) {
               var scope = angular.element($('#player')).scope();
               scope.player.pauseVideo();
               var msg = actionInfo.user + ' paused song';
               Materialize.toast(msg, 2000, 'rounded');
            }

         // Play player
         } else if (actionInfo.action === 'play') {
            if ($scope.username != actionInfo.user) {
               var scope = angular.element($('#player')).scope();
               scope.player.playVideo();
               var msg = actionInfo.user + ' played song';
               Materialize.toast(msg, 2000, 'rounded');
            }

         // Skip song
         } else if (actionInfo.action === 'next') {
            if ($scope.username != actionInfo.user) {
               $scope.playNextSong();
               var msg = actionInfo.user + ' skipped song';
               Materialize.toast(msg, 2000, 'rounded');
            }

         // New user joined room
         } else if (actionInfo.action === 'joined') {
            $scope.roomMembers.push(actionInfo.user);
            if ($scope.username != actionInfo.user) {
               var msg = actionInfo.user + ' joined';
               Materialize.toast(msg, 2000, 'rounded');

               // Send room info (current users & song queue) to sync data
               sendActionInfo($scope.roomID, null, null, $scope.username, "dataSync", $scope.roomMembers, $scope.songQueue);

            }

         // Sync room members and song queue data
         } else if (actionInfo.action === 'dataSync') {
            // TODO: Not the best way to do it. Works for now.
            // Basically all clients are updating their roomMembers info
            // even though only the one that just joined needs to.
            console.log(actionInfo.songQueue);

            if ($scope.username != actionInfo.user) {
               $scope.roomMembers = actionInfo.data;
               $scope.songQueue = actionInfo.songQueue;
            }

         } else if (actionInfo.action === 'singleAudioOutput') {
            if ($scope.username != actionInfo.user) {
               var scope = angular.element($('#player')).scope();
               scope.player.mute()
               $scope.audioSpeakerUser = actionInfo.user;
            }

         } else if (actionInfo.action === 'multiAudioOutput') {
            $scope.audioSpeakerUser = 'ALL';
         }

      });
   }

   $scope.openModal = function() {
      console.log("open modal");
      $('#modal1').modal('open');
   }

   $scope.openAudioSettingsModal = function() {
      $('#modal3').modal('open')
   }

   $scope.createRoom = function() {
      if (!this.roomName) {
         Materialize.toast("You must enter a Room Name", 2000);
         return;
      }
      if (!this.username) {
         Materialize.toast("You must choose a Username", 2000);
         return;
      }

      $http.get("/api/genuuid").then(function(res) {
         console.log(res.data);
         $scope.roomID = res.data.roomUID;
         $scope.clientID = res.data.clientUID;
         $scope.roomName = $('<p>').html($scope.roomName).text();
         $scope.username = $('<p>').html($scope.username).text();
         $scope.joined = true;
         $scope.inviteLink = window.location.host + "/ws" + $scope.roomID

         var data = {roomID: $scope.roomID, clientID: $scope.clientID, roomName: $scope.roomName, connection: conn}
         conn.send(JSON.stringify(data));

         sendActionInfo($scope.roomID, null, null, $scope.username, "joined", null, null);
      });

   }

   $scope.joinRoom = function() {
      if (!this.roomID) {
         Materialize.toast("You must enter a Room ID", 2000);
         return;
      }
      if (!this.username) {
         Materialize.toast("You must choose a Username", 2000);
         return;
      }

      var data = $.param({
         roomID: $scope.roomID
      });

      $http.post("/api/join", data, this.config).then(function(res) {
         $scope.clientID = res.data.clientUID;
         $scope.roomName = res.data.roomName;
         $scope.joined = true;

         var data = {roomID: $scope.roomID, clientID: $scope.clientID, roomName: $scope.roomName, connection: conn}
         conn.send(JSON.stringify(data));

         sendActionInfo($scope.roomID, null, null, $scope.username, "joined", null, null);
      });
   }

   $scope.addSongToQueue = function(keyEvent) {
      if (keyEvent.which == 13) {
         if (this.songUrl != '') {
            // Get youtube video id
            var videoID = this.songUrl.split('v=')[1];
            var ampersandPosition = videoID.indexOf('&');
            if (ampersandPosition != -1) {
               videoID = videoID.substring(0, ampersandPosition);
            }

            url = "https://www.googleapis.com/youtube/v3/videos?id="+videoID+"&key="+YTAPIKEY+"&part=snippet"
            $http.get(url).then(function(res) {
               var title = res.data.items[0].snippet.title;
               sendActionInfo($scope.roomID, videoID, title, $scope.username, "addSong", null, null);
            });

            this.songUrl = '';
         }
      }
   }

   $scope.pause = function() {
      var scope = angular.element($('#player')).scope();
      scope.player.pauseVideo();
      var ctlInfo = {roomID: this.roomID, videoID: null, user: this.username, action: "pause", data: null, songQueue: null};
      conn.send(JSON.stringify(ctlInfo));
   }

   $scope.play = function() {
      var scope = angular.element($('#player')).scope();
      scope.player.playVideo();
      var ctlInfo = {roomID: this.roomID, videoID: null, user: this.username, action: "play", data: null, songQueue: null};
      conn.send(JSON.stringify(ctlInfo));
   }

   $scope.next = function() {
      var ctlInfo = {roomID: this.roomID, videoID: null, user: this.username, action: "next", data: null, songQueue: null};
      conn.send(JSON.stringify(ctlInfo));
      this.playNextSong();

   }



   $scope.playNextSong = function() {
      if (this.songQueue.queue.length > 1) {
         if (this.songQueue.currentSongQueueIndex === (this.songQueue.queue.length) - 1) {
            this.songQueue.currentSongQueueIndex = 0;
         } else {
            this.songQueue.currentSongQueueIndex += 1;
         }
         this.songQueue.currentSongID = this.songQueue.queue[this.songQueue.currentSongQueueIndex].videoID;
      }
   }

   $scope.search = function(keyEvent) {
      if (keyEvent.which == 13) {
         var query = encodeURIComponent(this.searchQuery);
         url = "https://www.googleapis.com/youtube/v3/search?part=snippet&q="+query+"&key="+YTAPIKEY;
         $http.get(url).then(function(res) {
            console.log(res.data);
            $scope.searchQueryResults = res.data.items;
            $('#modal2').modal('open');
         });
      }
   }

   $scope.addSearchedSong = function(songInfo) {
      var videoID = songInfo.id.videoId;
      var title = songInfo.snippet.title;
      this.songThumbnails.push(songInfo.snippet.thumbnails.default.url)
      sendActionInfo(this.roomID, videoID, title, this.username, "addSong", null, null);
      this.searchQuery = '';
      $('#modal2').modal('close');
   }

   $scope.audioSettings = function(option) {
      if (option === 0) {
         sendActionInfo(this.roomID, null, null, this.username, "singleAudioOutput", null, null);
      } else {
         sendActionInfo(this.roomID, null, null, this.username, "multiAudioOutput", null, null);
      }

      $('#modal3').modal('close')
   }

   // ------------------ Utility Function ------------------
   function sendActionInfo(_roomID, _videoID, _videoTitle, _username, _action, _data, _songQueue) {
      var actionInfo = {
         roomID: _roomID,
         videoID: _videoID,
         videoTitle: _videoTitle,
         user: _username,
         action: _action,
         data: _data,
         songQueue: _songQueue
      }
      conn.send(JSON.stringify(actionInfo));
   }

}]);
