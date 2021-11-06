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
const userName = prompt("What's your name?");

myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id)
})

const myVideo = document.createElement('video')
myVideo.muted = true
const peers = {}
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  addVideoStream(myVideo, stream)

myPeer.on('call', call => {
  call.answer(stream)
  console.log("peer:",call.peer)
  peers[call.peer] = call
  const video = document.createElement('video')
  call.on('stream', remoteStream => {
    addVideoStream(video, remoteStream)
  })
  call.on('close', () => {
    video.remove()
  })
})

  socket.on('user-connected', userId => {
    setTimeout(() => {
      // user joined
      connectToNewUser(userId, stream)
      }, 1000)
    })

  socket.on('user-disconnected', userId => {
    console.log('user disconnected!:',userId)
    setTimeout(() => {
      if (peers[userId]) peers[userId].close()
      }, 1000)
    })

  socket.on('receive-msg', data => {
    setTimeout(() => {
      console.log(data)
      insertMessageToDOM(data, data.userName==userName)
      }, 1000)
    })  

  socket.on('host-disconnected', download_link => {
    setTimeout(() => {
      window.location.replace(download_link);
    }, 1000)
  })

})

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  call.on('stream', remoteStream => {
    addVideoStream(video, remoteStream)
  })
  call.on('close', () => {
    video.remove()
  })
  console.log("peer:",userId)
  peers[userId] = call
}

function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
}

const form = document.querySelector('form');
form.addEventListener('submit', () => {
  const input = document.querySelector('input[type="text"]');
  const value = input.value;
  input.value = '';
  const data = {
    userName,
    content: value,
    emoji,
  };
  socket.emit('send-msg', data)
});


function insertMessageToDOM(options, isFromMe) {
  const template = document.querySelector('template[data-template="message"]');
  const nameEl = template.content.querySelector('.message__name');
  if (options.emoji || options.userName) {
    nameEl.innerText = options.emoji + ' ' + options.userName;
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