var app = angular.module('UpNext', ['youtube-embed']).run(function($rootScope) {
   $rootScope.rootPlayer = null;
});

app.controller('MainCtl', ['$scope', function($scope, $rootScope) {
   $scope.roomID = null;
   $scope.username = null;
   $scope.joined = false;
   $scope.songUrl = null;
   $scope.roomMembers = [];

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

   // Establish a websocket connection
   var conn = new WebSocket("ws://" + window.location.host + "/ws");

   // When the client connection is terminated
   conn.onclose = function(e) {
      $scope.$apply(function() {
         console.log("WS Connection Closed");
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

         // TODO: This code is sort of repetive. It can be further simplified.
         // Add Song
         if (actionInfo.action === 'addSong') {
            var queueItem = {user: actionInfo.user, videoID: actionInfo.videoID}
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
               var actionInfo = {roomID: $scope.roomID, videoID: null, user: $scope.username, action: 'dataSync', data: $scope.roomMembers, songQueue: $scope.songQueue};
               conn.send(JSON.stringify(actionInfo));

               // var actionInfo = {roomID: $scope.roomID, videoID: null, user: $scope.username, action: 'dataSyncQ', data: $scope.songQueue.queue, songQueue: null};
               // conn.send(JSON.stringify(actionInfo));
            }

         // Sync room members and song queue data
         } else if (actionInfo.action === 'dataSync') {
            // TODO: Not the best way to do it. Works for now.
            // Basically all clients are updating their roomMembers info
            // even though only the one that just joined needs to.
            console.log(actionInfo.songQueue);

            if ($scope.username != actionInfo.user) {
               console.log($scope.songQueue);
               $scope.roomMembers = actionInfo.data;
               $scope.songQueue = actionInfo.songQueue;
               console.log($scope.songQueue);
            }

         }

      });
   }

   $scope.join = function() {
      if (!this.roomID) {
         Materialize.toast("You must enter a roomID", 2000);
         return;
      }
      if (!this.username) {
         Materialize.toast("You must choose a username", 2000);
         return;
      }
      this.roomID = $('<p>').html(this.roomID).text();
      this.username = $('<p>').html(this.username).text();
      this.joined = true;

      conn.send(
         JSON.stringify({
            roomID: this.roomID,
            connection: conn
         }
      ));

      this.sendStatus();

   }

   $scope.sendStatus = function() {
      var actionInfo = {roomID: this.roomID, videoID: null, user: this.username, action: 'joined', data: null, songQueue: null};
      conn.send(JSON.stringify(actionInfo));
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

            // Contruct song info JSON entry
            var actionInfo = {roomID: this.roomID, videoID: videoID, user: this.username, action: "addSong", data: null, songQueue: null};

            // Send actionInfo the the server over the websocket connection
            conn.send(JSON.stringify(actionInfo));

            this.songUrl = '';
         }
      }
   }

   $scope.pause = function() {
      console.log("Pause Video");
      var scope = angular.element($('#player')).scope();
      scope.player.pauseVideo();
      var ctlInfo = {roomID: this.roomID, videoID: null, user: this.username, action: "pause", data: null, songQueue: null};
      conn.send(JSON.stringify(ctlInfo));
   }

   $scope.play = function() {
      console.log("Play Video");
      var scope = angular.element($('#player')).scope();
      scope.player.playVideo();
      var ctlInfo = {roomID: this.roomID, videoID: null, user: this.username, action: "play", data: null, songQueue: null};
      conn.send(JSON.stringify(ctlInfo));
   }

   $scope.next = function() {
      console.log("Next Video");
      var ctlInfo = {roomID: this.roomID, videoID: null, user: this.username, action: "next", data: null, songQueue: null};
      conn.send(JSON.stringify(ctlInfo));
      var scope = angular.element($('#player')).scope();
      scope.playNextSong();

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


}]);
