require('dotenv').config()

const Web3 = require('web3')
const web3 = new Web3(process.env.INFURA)
const _ = require('lodash')

// get events helper
module.exports = async (address, abi, fromBlock, eventName) => {
const isAddress =	web3.utils.isAddress(address)
if(isAddress){
const contract = new web3.eth.Contract(abi, address)
 try {
   let getEvent = await contract.getPastEvents(
    eventName,
    {
      fromBlock: fromBlock,
      toBlock: 'latest'
    }
   )
  return getEvent
  }
  catch(err){
  return new Error(err);
}
}
else{
	return new Error("Not correct address");
}
}
