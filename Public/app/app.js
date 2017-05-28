var app = angular.module('UpNext', ['youtube-embed']).run(function($rootScope) {
   $rootScope.rootPlayer = null;
});

app.controller('MainCtl', ['$scope', function($scope, $rootScope) {
   $scope.roomID = null;
   $scope.username = null;
   $scope.joined = false;
   $scope.songUrl = null;

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

   $scope.$on('youtube.player.paused', function ($event, player) {
    // play it again
    console.log("stoped");
  });

   var conn = new WebSocket("ws://" + window.location.host + "/ws");

   conn.onclose = function(e) {
      console.log("WS Connection Closed");
   }

   conn.onopen = function(e) {
      console.log("WS Connection Opened");
   }

   conn.onmessage = function(e) {
      $scope.$apply(function() {
         var actionInfo = JSON.parse(e.data);

         // Add Song
         if (actionInfo.action === 'addSong') {
            $scope.songQueue.queue.push(actionInfo);

            if ($scope.username != actionInfo.user) {
               var msg = actionInfo.user + ' added a song';
               Materialize.toast(msg, 2000, 'rounded');
            }

            // Setup song queue
            if ($scope.songQueue.queue.length === 1) {
               $scope.songQueue.currentSongQueueIndex = 0;
               $scope.songQueue.currentSongID = $scope.songQueue.queue[$scope.songQueue.currentSongQueueIndex].videoID;
            }
         } else if (actionInfo.action === 'pause') {
            if ($scope.username != actionInfo.user) {
               var scope = angular.element($('#player')).scope();
               console.log(scope);
               scope.player.pauseVideo();
               var msg = actionInfo.user + ' paused song';
               Materialize.toast(msg, 2000, 'rounded');
            }

         } else if (actionInfo.action === 'play') {
            if ($scope.username != actionInfo.user) {
               var scope = angular.element($('#player')).scope();
               console.log(scope);
               scope.player.playVideo();
               var msg = actionInfo.user + ' played song';
               Materialize.toast(msg, 2000, 'rounded');
            }

         } else if (actionInfo.action === 'next') {
            if ($scope.username != actionInfo.user) {
               $scope.playNextSong();
               var msg = actionInfo.user + ' skipped song';
               Materialize.toast(msg, 2000, 'rounded');
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
            var actionInfo = {roomID: this.roomID, videoID: videoID, user: this.username, action: "addSong"};

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
      var ctlInfo = {roomID: this.roomID, videoID: null, user: this.username, action: "pause"};
      conn.send(JSON.stringify(ctlInfo));
   }

   $scope.play = function() {
      console.log("Play Video");
      var scope = angular.element($('#player')).scope();
      scope.player.playVideo();
      var ctlInfo = {roomID: this.roomID, videoID: null, user: this.username, action: "play"};
      conn.send(JSON.stringify(ctlInfo));
   }

   $scope.next = function() {
      console.log("Next Video");
      var ctlInfo = {roomID: this.roomID, videoID: null, user: this.username, action: "next"};
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
