const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')

const room_host = {}

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})

io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId)
    socket.to(roomId).broadcast.emit('user-connected', userId)
    if(!(roomId in room_host)) room_host[roomId] = userId
    console.log(room_host[roomId], userId)
    socket.on('disconnect', () => {
      if(userId == room_host[roomId]){
        const download_link = "https://google.com"
        socket.to(roomId).broadcast.emit('host-disconnected', download_link)
        delete room_host[roomId]
      }
      else{
        socket.to(roomId).broadcast.emit('user-disconnected', userId)
      }
    })
  })
})

server.listen(3000)
