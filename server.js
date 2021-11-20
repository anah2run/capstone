const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')

const room_info = {}

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})

io.on('connection', socket => {
  socket.on('join-room', (roomId, userData) => {
    socket.join(roomId)
    socket.to(roomId).broadcast.emit('user-connected', userData)
    userID = socket.id
    if(!(roomId in room_info)) {
      const users = {}
      users[userID] = userData
      const info = {
        host: userID,
        users: users
      };
      room_info[roomId] = info
    }
    else{
      room_info[roomId].users[userID] = userData
      console.log(room_info[roomId] )
    }
    socket.on('send-msg', (msg) =>{
      senderData = room_info[roomId].users[socket.id]
      const data = {
        emoji : senderData.emoji,
        userName : senderData.userName,
        content: msg.content,
      };
      socket.to(roomId).broadcast.emit('receive-msg', data)
    }) 
    socket.on('disconnect', () => {
      disconnectedID = socket.id
      if(disconnectedID == room_info[roomId].host){
        const download_link = "https://google.com"
        socket.to(roomId).broadcast.emit('host-disconnected', download_link)
        delete room_info[roomId]
      }
      else{
        userData=room_info[roomId].users[disconnectedID]
        socket.to(roomId).broadcast.emit('user-disconnected',userData)
        console.log(userData, room_info[disconnectedID])
        delete room_info[roomId].users[disconnectedID]
      }
    })
  })
})

server.listen(3000)
