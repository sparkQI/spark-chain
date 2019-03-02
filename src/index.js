const vorpal = require('vorpal')();
const Blockchain = require('./block-chain');
const Table =  require('cli-table');


function formatLog(data){
  if(!Array.isArray(data)){
    data = [data]
  }
  const first = data[0]
  const head = Object.keys(first)

  const table = new Table({
      head: head,
      colWidths: new Array(head.length).fill(15)
  })
  const res = data.map(v=>{
    return head.map(h => JSON.stringify(v[h],null,1))
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
  .command('mine <address>', 'mining')
  .action(function(args, callback) {
    this.log('new block:');
    const newBlock = blockchain.mine(args.address)
    if(newBlock){
      formatLog(newBlock);
    }
    callback();
  });

vorpal
    .command('chain', 'welcome to spark-chain')
    .action(function(args, callback) {
      this.log('chain: ');
      formatLog(blockchain.blockchain)
      callback();
  });

vorpal
    .command('trans <from> <to> <amount>', 'transfer')
    .action(function(args, callback) {
        let trans = blockchain.transfer(args.from, args.to, args.amount)
        if(trans){formatLog(trans)}

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
    if(balance){
      formatLog({balance,address:args.address})
    }
    callback();
  });
console.log('welcome to spark-chain simulator');
vorpal
    .exec('help')
vorpal
  .delimiter('spark-chain$')
  .show();
