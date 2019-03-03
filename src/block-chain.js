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
const rsa = require('./rsa')
// start block
const initblock = {
  index: 0,
  data: 'Hello',
  prevHash: '0',
  timestamp: 1551459649370,
  nonce: 101027,
  hash: '000000944f29c2e7bb83b0bf55d4ee73d0af3faaaba551443bb23ccf334a8aa4'
}


class Blockchain {
  constructor() {
    this.blockchain = [
      initblock
    ]
    this.data = []
    this.difficulty = 4
    //const hash = this.computeHash(0,'0',new Date().getTime(),'Hello!',1)
    //trust node : address + port
    this.peers = []
    this.remote = {}
    //
    this.seed = {
      port: 9999,
      address: '95.169.22.154'
    }
    this.udp = dgrm.createSocket('udp4')
    this.init()

  }

  init() {
    this.bindP2P()
    this.bindExit()
  }
  /**

  */
  bindP2P() {
    this.udp.on('message', (data, remote) => {
      const {
        address,
        port
      } = remote

      const action = JSON.parse(data)
      if (action.type) {
        this.dispatch(action, {
          address,
          port
        })

      }
    })
    this.udp.on('listening', () => {
      const address = this.udp.address()
      console.log('===>' + address.port)
    })
    // seed port is fixed
    console.log(process.agv);
    const port = Number(process.argv[2]) || 0
    this.startNode(port)
  }

  bindExit() {
    process.on('exit', () => {
      console.log('see u')
    })
  }

  dispatch(action, remote) {
    switch (action.type) {
      case 'newPeer':
        console.log('hello new peer', remote)
        // send back: seed ip+port; peer list; boardcast new peer; send ledger
        this.send({
          type: 'remoteAddress',
          data: remote
        }, remote.port, remote.address)
        this.send({
          type: 'peerList',
          data: this.peers
        }, remote.port, remote.address)
        this.boardcast({
          type: 'welcome',
          data: remote
        })
        this.send({
          type:'blockchain',
          data:JSON.stringify({
            blockchain:this.blockchain,
            trans:this.data
          })
        },remote.port,remote.address)
        this.peers.push(remote)
        break;
      case 'remoteAddress':
        this.remote = action.data
        break
      case 'peerList':
        const newPeers = action.data
        this.addPeers(newPeers)
        break
      case 'welcome':
        let remotePeer = action.data
        this.peers.push(remotePeer)
        console.log('hello, welcome to join us', remotePeer);
        this.send({
          type: 'hi',data:'hi'
        }, remotePeer.port, remotePeer.address)
        break
      case 'hi':
        console.log(`from ${remote.address} : ${remote.port} => ${action.data}`)
        break
      case 'blockchain':
        let allData = JSON.parse(action.data)
        let newChain = allData.blockchain
        let newTrans = allData.trans
        this.replaceChain(newChain)
        this.replaceTrans(newTrans)
        break

      case 'trans':
        //repeat trans
        if(!this.data.find(v=>this.isEqualObj(v, action.data))){
          console.log('new trans =====> sync finished',action.data)
          this.addTrans(action.data)
          this.boardcast({
            type:'trans',
            data:action.data
          })
        }
      case 'mine':
        //not repeat
        const lastBlock = this.getLastBlock()
        if(lastBlock.hash===action.data.hash){
          return
        }
        //check vaild
        if(this.isValidBlock(action.data,lastBlock)){
          console.log(" peers' new block is valid");
          this.blockchain.push(action.data)
          this.data = []
          this.boardcast({
            type:'mine',
            data:action.data
          })
        }else{
          console.log("peer's new block invlid");
        }
      break
      default:
        console.log('error type');


    }
  }

  isEqualObj(obj1,obj2){
    const key1 = Object.keys(obj1)
    const key2 = Object.keys(obj2)
    if(key1.length!==key2.length){
      return false
    }
    return key1.every(key=>obj1[key]===obj2[key])
  }

  // isEqualPeer(peer1, peer2) {
  //   return peer1.address == peer2.address && peer1.port == peer2.port
  // }

  addPeers(peers) {
    peers.forEach(peer => {
      if (!this.peers.find(v => this.isEqualObj(peer, v))) {
        this.peers.push(peer)
      }
    })
  }


  startNode(port) {
    this.udp.bind(port)
    if (port !== 9999) {
      console.log('sending')
      this.send({
        type: 'newPeer'
      }, this.seed.port, this.seed.address)
      console.log('finished');
      this.peers.push(this.seed)
    }

  }


  send(message, port, host) {
    this.udp.send(JSON.stringify(message), port, host)
  }

  boardcast(action) {
    this.peers.forEach(v => {
      this.send(action, v.port, v.address)
    })
  }

  getLastBlock() {
    return this.blockchain[this.blockchain.length - 1]
  }


  mine(address) {
    //generate new blockchain
    // if(!this.data.every(v=>this.isValidTrans(v))){
    //   console.log('trans not valid')
    //   return
    // }

    //keep valid transfer
    this.data = this.data.filter(v => this.isValidTrans(v))
    //each mine min
    this.transfer('0', address, 100)


    const newBlock = this.createNewBlock()
    // vaild check
    if (this.isValidBlock(newBlock) && this.isValidChain(this.blockchain)) {
      this.blockchain.push(newBlock)
      this.data = []
      //console.log(this.blockchain);
      this.boardcast({
        type:"mine",
        data: newBlock
      })
      console.log('finished newBlock boardcast')
      return newBlock;
    } else {
      console.log("invalid block");
    }

  }

  createNewBlock() {
    let nonce = 0
    const index = this.blockchain.length
    const data = this.data
    const prevHash = this.getLastBlock().hash
    let timestamp = new Date().getTime()
    //keep hash comptation
    let hash = this.computeHash(index, prevHash, timestamp, data, nonce)
    while (hash.slice(0, this.difficulty) !== '0'.repeat(this.difficulty)) {
      nonce += 1
      hash = this.computeHash(index, prevHash, timestamp, data, nonce)
      //console.log(nonce,hash);
    }
    return {
      index,
      data,
      prevHash,
      timestamp,
      nonce,
      hash
    };
  }
  computeHash(index, prevHash, timestamp, data, nonce) {
    return crypto
      .createHash('sha256')
      .update(index + prevHash + timestamp + data + nonce)
      .digest('hex')
  }

  computeHashForBlock(newBlock) {
    return this.computeHash(newBlock.index, newBlock.prevHash, newBlock.timestamp, newBlock.data, newBlock.nonce)
  }

  isValidBlock(newBlock, lastBlock = this.getLastBlock()) {
    //checkpoint:
    //1.index +1
    //2.timestamp > lastBlock timestamp
    //3.prevhash = lastBlock prevHash
    //4.difficulty
    if (newBlock.index !== lastBlock.index + 1) {
      console.log('index', newBlock.index);
      return false
    } else if (newBlock.timestamp <= lastBlock.timestamp) {
      console.log('time', newBlock.timestamp);
      return false
    } else if (newBlock.prevHash !== lastBlock.hash) {
      return false
    } else if (newBlock.hash.slice(0, this.difficulty) !== '0'.repeat(this.difficulty)) {
      return false
    } else if (newBlock.hash !== this.computeHashForBlock(newBlock)) {
      return false
    }
    return true
  }
  isValidChain(chain = this.blockchain) {
    for (let i = chain.length - 1; i >= 1; i = i - 1) {
      if (!this.isValidBlock(chain[i], chain[i - 1])) {
        return false
      }
    }
    if (JSON.stringify(chain[0]) !== JSON.stringify(initblock)) {
      return false
    }
    return true
  }

  isValidTrans(trans) {

    return rsa.verify(trans, trans.from)
  }

  addTrans(trans){
    if(this.isValidTrans(trans)){
      console.log("valid trans")
      this.data.push(trans)
    }
  }

  replaceChain(newChain){
    if(newChain.length ===1){
      return
    }
    if(this.isValidChain(newChain) && newChain.length>this.blockchain.length){
      this.blockchain = JSON.parse(JSON.stringify(newChain))
    }else{
      console.log('invalid chain!!!')
    }
  }

  replaceTrans(trans){
    if(trans.every(v=>this.isValidTrans(v))){
      this.data = trans
    }
  }

  transfer(from, to, amount) {
    const timestamp = new Date().getTime()
    const signature = rsa.sign({
      from,
      to,
      amount,
      timestamp
    })
    const sigObject = {
      from,
      to,
      amount,
      timestamp,
      signature
    }

    // verify sign
    if (from !== '0') {
      const balance = this.balance(from)
      if (balance < amount) {
        console.log('not enough balance', from, balance, amount)
        return
      }
      console.log(sigObject);
      this.boardcast({
        type:"trans",
        data:sigObject
      })
    }


    this.data.push(sigObject)
    return sigObject
  }

  balance(address) {
    let balance = 0
    this.blockchain.forEach(block => {
      if (!Array.isArray(block.data)) {
        return
      }


      block.data.forEach(trans => {
        if (address == trans.from) {
          balance -= trans.amount
        }

        if (address == trans.to) {
          balance += trans.amount
        }
      })
    })
    return balance
  }
}

module.exports = Blockchain
