const dgrm = require('dgram')

const udp = dgrm.createSocket('udp4')

// receive message

udp.on('message',(data,remote)=>{
  console.log('accept message'+ data.toString())
  console.log(remote)
})

udp.on('listening',function(){
  const address = udp.address()
  console.log('udp server is listening'+address.address+':'+address.port)
})

udp.bind(0)

// send message
function send(message,port,host){
  console.log('send meassage', message,host,port);
  udp.send(Buffer.from(message),port,host)
}

const port = Number(process.argv[2])

const host = process.argv[3]


if(port&&host){
  send('hello my server!',port,host)
}
