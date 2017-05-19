new Vue({
   el: "#app",
   data: {
      ws: null,
      newMsg: "",
      chatContent: "",
      email: null,
      username: null,
      joined: false
   },

   created: function() {
      var self = this;
      this.ws = new WebSocket("ws://" + window.location.host + "/ws");
      this.ws.addEventListener("message", function(e) {
         var msg = JSON.parse(e.data);
         self.chatContent += '<div class="chip"'
            + '<img src=""' + self.gravatarURL(msg.email) + '">"'
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
               email: this.email,
               username: this.username,
               message: $('<p>').html(this.newMsg).text()
            }
         ));
         this.newMsg = ""
      },

      join: function() {
         if (!this.email) {
            Materialize.toast("You must enter an email", 2000);
            return;
         }
         if (!this.username) {
            Materialize.toast("You must choose a username", 2000);
            return;
         }
         this.email = $('<p>').html(this.email).text();
         this.username = $('<p>').html(this.username).text();
         this.joined = true;
      },

      gravatarURL: function(email) {
         return 'http://www.gravatar.com/avatar/' + CryptoJS.MD5(email);
      }
   }

});
