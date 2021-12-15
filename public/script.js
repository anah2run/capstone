
function openNav() {
  document.getElementById("chat-box").style.width = "400px";
  document.getElementById("main").style.marginLeft = "400px";
}

function closeNav() {
  document.getElementById("chat-box").style.width = "0";
  document.getElementById("main").style.marginLeft= "0";
}

const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined, {
  host: '/',
  port: '3001'
})

const possibleEmojis = [
  '🐀','🐁','🐭','🐹','🐂','🐃','🐄','🐮','🐅','🐆','🐯','🐇','🐐','🐑','🐏','🐴',
  '🐎','🐱','🐈','🐰','🐓','🐔','🐤','🐣','🐥','🐦','🐧','🐘','🐩','🐕','🐷','🐖',
  '🐗','🐫','🐪','🐶','🐺','🐻','🐨','🐼','🐵','🙈','🙉','🙊','🐒','🐉','🐲','🐊',
  '🐍','🐢','🐸','🐋','🐳','🐬','🐙','🐟','🐠','🐡','🐚','🐌','🐛','🐜','🐝','🐞',
];
function randomEmoji() {
  var randomIndex = Math.floor(Math.random() * possibleEmojis.length);
  return possibleEmojis[randomIndex];
}

const emoji = randomEmoji();
const myName = prompt("What's your name?");
var userID = "";

myPeer.on('open', uid => {
  const userData = {
    uid,
    userName : myName,
    emoji,
  };
  userID = uid;
  socket.emit('join-room', ROOM_ID, userData)
  insertNotificationToDOM(emoji + myName + " has joined the room")
})

const myVideo = document.createElement('div')
myVideo.muted = true
const peers = {}
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  addVideoStream(myVideo, stream, emoji+myName)

myPeer.on('call', call => {
  call.answer(stream)
  userData = call.metadata  
  console.log("peer:",call.peer)
  peers[call.peer] = call
  const div = document.createElement('div')
  call.on('stream', remoteStream => {
    addVideoStream(div, remoteStream,userData.userName)
  })
  call.on('close', () => {
    div.remove()
  })
})

  socket.on('user-connected', userData => {
    const userName = userData.userName
    const userEmoji = userData.emoji
    const userId = userData.uid
    setTimeout(() => {
      // user joined
      connectToNewUser(userData, stream)
      console.log('user connected!:',userData)
      insertNotificationToDOM(userEmoji + userName + " has joined the room")
      }, 1000)
    })

  socket.on('user-disconnected', userData => {
    const userName = userData.userName
    const userEmoji = userData.emoji
    const userId = userData.uid
    console.log('user disconnected!:',userData)
    setTimeout(() => {
      if (peers[userId]) {
        insertNotificationToDOM(userEmoji + userName + " has left the room")
        peers[userId].close()
      }
      }, 1000)
    })

  socket.on('receive-msg', data => {
    setTimeout(() => {
      console.log(data)
      insertMessageToDOM(data, false)
      }, 1000)
    })  

  socket.on('host-disconnected', download_link => {
    setTimeout(() => {
      window.location.replace(download_link);
    }, 1000)
  })

})

function connectToNewUser(userData, stream) {
  const userName = userData.userName
  const userEmoji = userData.emoji
  const userId = userData.uid
  const call = myPeer.call(userId, stream, { metadata: { userName: emoji+myName } })
  myPeer.sen
  const div = document.createElement('div')
  call.on('stream', remoteStream => {
    addVideoStream(div, remoteStream, userEmoji+userName)
  })
  call.on('close', () => {
    div.remove()
  })
  console.log("peer:",userId)
  peers[userId] = call
}

function addVideoStream(div, stream, name) {
  div.innerText =""
  div.id = "camera"
  const video = document.createElement('video')
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  div.appendChild(video)
  const p = document.createElement('p')
  p.innerText = String(name)
  div.appendChild(p)
  videoGrid.append(div)
}

const form = document.querySelector('form');
form.addEventListener('submit', () => {
  const input = document.querySelector('input[type="text"]');
  const value = input.value;
  input.value = '';
  const data = {
    userID,
    content: value,
  };
  socket.emit('send-msg', data)
  insertMessageToDOM(data, true)
});

function insertNotificationToDOM(msg){
  const template = document.querySelector('template[data-template="notification"]');
  const msgEl = template.content.querySelector('.notification__message');
  msgEl.innerText = msg;
  const clone = document.importNode(template.content, true);
  const messagesEl = document.querySelector('.messages');
  messagesEl.appendChild(clone);
  messagesEl.scrollTop = messagesEl.scrollHeight - messagesEl.clientHeight;
}

var lastTimestamp = ""
function createTimestampText(ts){
  return ('0'+ts.getHours()).slice(-2) + ':' + ('0'+ts.getMinutes()).slice(-2);
}

function insertMessageToDOM(options, isFromMe) {
  const template = document.querySelector('template[data-template="message"]');
  const nameEl = template.content.querySelector('.message__name');
  if(isFromMe){
    nameEl.innerText = emoji + ' ' + myName;
  }
  else if (options.emoji || options.userName) {
    nameEl.innerText = options.emoji + ' ' + options.userName;
  }
  timestamp = createTimestampText(new Date());
  const timestampEl = template.content.querySelector('.message__timestamp');
  if (timestamp != lastTimestamp){
    lastTimestamp = timestamp;
    timestampEl.innerText = timestamp;
    timestampEl.style.display = 'inline';
  }
  else{
    timestampEl.style.display = 'none';
  }
  template.content.querySelector('.message__bubble').innerText = options.content;
  const clone = document.importNode(template.content, true);
  const messageEl = clone.querySelector('.message');
  if (isFromMe) {
    messageEl.classList.add('message--mine');
  } else {
    messageEl.classList.add('message--theirs');
  }

  const messagesEl = document.querySelector('.messages');
  messagesEl.appendChild(clone);

  // Scroll to bottom
  messagesEl.scrollTop = messagesEl.scrollHeight - messagesEl.clientHeight;
}
