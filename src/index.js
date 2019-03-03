const vorpal = require('vorpal')();
const Blockchain = require('./block-chain');
const Table = require('cli-table');
const rsa = require('./rsa')

function formatLog(data) {
  if (!data || data.length === 0) {
    return
  }
  if (!Array.isArray(data)) {
    data = [data]
  }
  const first = data[0]
  const head = Object.keys(first)

  const table = new Table({
    head: head,
    colWidths: new Array(head.length).fill(30)
  })
  const res = data.map(v => {
    return head.map(h => JSON.stringify(v[h], null, 1))
  })
  table.push(...res);
  console.log(table.toString());
}






const blockchain = new Blockchain()




vorpal
  .command('hello', 'welcome to spark-chain')
  .action(function(args, callback) {
    this.log('welcome to spark-chain');
    callback();
  });

vorpal
  .command('mine', 'mining')
  .action(function(args, callback) {
    this.log('new block:');
    const newBlock = blockchain.mine(rsa.keys.pk)
    if (newBlock) {
      formatLog(newBlock);
    }
    callback();
  });

vorpal
  .command('blockchain', 'welcome to spark-chain')
  .action(function(args, callback) {
    this.log('chain: ');
    formatLog(blockchain.blockchain)
    callback();
  });

vorpal
  .command('trans <to> <amount>', 'transfer')
  .action(function(args, callback) {
    let trans = blockchain.transfer(rsa.keys.pk, args.to, args.amount)
    if (trans) {
      formatLog(trans)
    }

    callback()
  });

vorpal
  .command('detail <index>', 'detail of block:')
  .action(function(args, callback) {
    this.log(args.index)
    const block = blockchain.blockchain[args.index]
    formatLog(block)
    callback();
  });

vorpal
  .command('balance <address>', 'check user balance')
  .action(function(args, callback) {
    const balance = blockchain.balance(args.address)
    if (balance) {
      formatLog({
        balance,
        address: args.address
      })
    }
    callback();
  });

vorpal
  .command('pk', 'local address')
  .action(function(args, callback) {
    console.log(rsa.keys.pk)
    callback();
  });

vorpal
  .command('peers', 'peer list')
  .action(function(args, callback) {
    formatLog(blockchain.peers)
    callback();
  });

vorpal
  .command('chat <message>', 'boardcast to others')
  .action(function(args, callback) {
    blockchain.boardcast({
      type:'hi',
      data:args.message
    })
    callback();
  });

  vorpal
    .command('pending', 'pending transaction')
    .action(function(args, callback) {
      formatLog(blockchain.data)

      callback();
    });

console.log('welcome to spark-chain simulator');
vorpal
  .exec('help')
vorpal
  .delimiter('spark-chain$')
  .show();
