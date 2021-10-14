const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined, {
  host: '/',
  port: '3001'
})

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
})

socket.on('user-disconnected', userId => {
  console.log('user disconnected!:',userId)
  setTimeout(() => {
    if (peers[userId]) peers[userId].close()
    }, 1000)
  })

socket.on('host-disconnected', download_link => {
  setTimeout(() => {
    window.location.replace(download_link);
  }, 1000)
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