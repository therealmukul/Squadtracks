new Vue({
   el: "#app",
   data: {
      ws: null,
      newMsg: "",
      chatContent: "",
      roomID: null,
      username: null,
      joined: false,
      newTodoText: '',
      songQueue: [
         {songTitle: 'Paris', addedBy: 'Mukul'},
         {songTitle: 'Closer', addedBy: 'Rabi'},
         {songTitle: 'New York City', addedBy: 'Yousuf'}
      ]
   },

   created: function() {
      var self = this;
      var tag = document.createElement('script');

      tag.src = "https://www.youtube.com/iframe_api";
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      this.ws = new WebSocket("ws://" + window.location.host + "/ws");
      this.ws.addEventListener("message", function(e) {
         var msg = JSON.parse(e.data);
         self.chatContent += '<div class="chip"'
            + '<img src=""' + self.gravatarURL("fd") + '">"'
            + msg.username
            + '</div>'
            + emojione.toImage(msg.message) + '<br/>';

         var element = document.getElementById("chat-messages");
         element.scrollTop = element.scrollHeight;
      });
   },

   methods: {
      send: function() {
         this.ws.send(
            JSON.stringify({
               roomID: this.roomID,
               username: this.username,
               message: $('<p>').html(this.newMsg).text()
            }
         ));
         this.newMsg = ""
      },

      join: function() {
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
         console.log("sent info");
         this.ws.send(
            JSON.stringify({
               roomID: this.roomID,
               connection: this.ws
            }
         ));
      },

      gravatarURL: function(email) {
         return 'http://www.gravatar.com/avatar/' + CryptoJS.MD5(email);
      },
   }

});
