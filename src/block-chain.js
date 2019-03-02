/**
Create Add Verify
trade
pk-sk
mine
p2p

structure:
{
  index:1
  timestamp: // XXX:
  data:
  hash:
  prevhash:
  nonce
}
*/
const crypto = require('crypto')
const dgrm = require('dgram')
// start block
const initblock = {
  index: 0,
  data: 'Hello',
  prevHash: '0',
  timestamp: 1551459649370,
  nonce: 101027,
  hash: '000000944f29c2e7bb83b0bf55d4ee73d0af3faaaba551443bb23ccf334a8aa4'
}


class Blockchain{
  constructor(){
     this.blockchain = [
       initblock
     ]
     this.data = []
     this.difficulty = 4
     //const hash = this.computeHash(0,'0',new Date().getTime(),'Hello!',1)
     //trust node : address + port
     this.peers = []
     this.seed = {port: 9999, address: 'localhost'}
     this.udp = dgrm.createSocket('udp4')
     this.init()

  }

  init(){
    this.bindP2P()
    this.bindExit()
  }
/**

*/
  bindP2P(){
    this.udp.on('message',(data,remote)=>{
      const {address, port} = remote

      const action = JSON.parse(data)
      if(action.type){
        this.dispatch(action,{address,port})

      }
    })
    this.udp.on('listening',()=>{
      const address = this.udp.address()
      console.log('===>'+address.port)
    })
    // seed port is fixed
    console.log(process.agv);
    const port = Number(process.argv[2]) || 0
    this.startNode(port)
  }

  bindExit(){
    process.on('exit',()=>{
      console.log('see u')
    })
  }

  dispatch(action,remote){
      switch (action.type) {
        case 'newPeer':
          console.log('hello new peer',remote)
          break;
        default:
          console.log('error type');


      }
  }

  startNode(port){
    this.udp.bind(port)
    if(port!=9999){
      this.send({type:'newPeer'},this.seed.port,this.seed.address)
    }
  }
  send(message,port,host){
    this.udp.send(JSON.stringify(message),port,host)
  }

  getLastBlock(){
    return this.blockchain[this.blockchain.length-1]
  }

  mine(address){
    //generate new blockchain
    //each mine min
    this.transfer('0',address,100)
    const newBlock = this.createNewBlock()
    // vaild check
    if(this.isValidBlock(newBlock)&& this.isValidChain(this.blockchain)){
      this.blockchain.push(newBlock)
      this.data = []
      //console.log(this.blockchain);
      return newBlock;
    }else{
      console.log("invalid block");
    }
  }

  createNewBlock(){
    let nonce = 0
    const index = this.blockchain.length
    const data = this.data
    const prevHash = this.getLastBlock().hash
    let timestamp = new Date().getTime()
    //keep hash comptation
    let hash = this.computeHash(index,prevHash,timestamp,data,nonce)
    while(hash.slice(0,this.difficulty)!=='0'.repeat(this.difficulty)){
      nonce += 1
      hash = this.computeHash(index,prevHash,timestamp,data,nonce)
      //console.log(nonce,hash);
    }
    return{
      index,
      data,
      prevHash,
      timestamp,
      nonce,
      hash
    };
  }
  computeHash(index,prevHash,timestamp,data,nonce){
    return crypto
          .createHash('sha256')
          .update(index+prevHash+timestamp+data+nonce)
          .digest('hex')
  }

  computeHashForBlock(newBlock){
    return this.computeHash(newBlock.index,newBlock.prevHash,newBlock.timestamp,newBlock.data,newBlock.nonce)
  }

  isValidBlock(newBlock, lastBlock = this.getLastBlock()){
    //checkpoint:
    //1.index +1
    //2.timestamp > lastBlock timestamp
    //3.prevhash = lastBlock prevHash
    //4.difficulty
    if(newBlock.index !== lastBlock.index+1){
      console.log('index',newBlock.index);
      return false
    }else if (newBlock.timestamp<=lastBlock.timestamp) {
      console.log('time',newBlock.timestamp);
      return false
    }else if (newBlock.prevHash!==lastBlock.hash) {
      return false
    }else if(newBlock.hash.slice(0,this.difficulty)!=='0'.repeat(this.difficulty)){
      return false
    }else if (newBlock.hash !== this.computeHashForBlock(newBlock)) {
      return false
    }
    return true
  }
  isValidChain(chain = this.blockchain){
    for(let i = chain.length-1; i>=1; i=i-1){
        if(!this.isValidBlock(chain[i],chain[i-1])){
          return false
        }
    }
    if(JSON.stringify(chain[0])!==JSON.stringify(initblock)){
      return false
    }
    return true
  }

  transfer(from, to, amount){
    // verify sign
    if(from !== '0'){
      const balance = this.balance(from)
      if(balance < amount){
        console.log('not enough balance', from, balance, amount)
        return
      }
    }

    const transObj = {from, to, amount}
    this.data.push(transObj)
    console.log(this.index,this.data)
    return transObj
  }

  balance(address){
    let balance = 0
    this.blockchain.forEach(block=>{
      if(!Array.isArray(block.data)){
        return
      }


      block.data.forEach(trans=>{
        if(address == trans.from){
          balance-= trans.amount
        }

        if(address == trans.to){
          balance += trans.amount
        }
      })
    })
    return balance
  }
}

module.exports = Blockchain
