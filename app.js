require('dotenv').config()
const Web3 = require('web3')
const web3 = new Web3(process.env.INFURA)

const abi = require('./abi.js')
const getEvent = require('./getEvent.js')
const _ = require('lodash')
const BigNumber = require('bignumber.js')
const fs = require('fs')
const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
const FUND_ADDRESS = "0xee169d57Bb0EAA8a5cb4a13862BF45Cd695F47E1"
const localDB = []
let result = []

const fund = new web3.eth.Contract(abi.FUND_ABI, FUND_ADDRESS)

// events parser
async function runEvensChecker(address, abi){
  let eventsObj = await getEvent(address, abi, 0, 'allEvents', web3)

  // Check if some events in case happen for this fund address
  if(!_.isEmpty(eventsObj)){

  for(let i =0; i < eventsObj.length; i++){
  const EventName = eventsObj[i].event

  switch(EventName){
    case 'Deposit':
    console.log(
      `Deposit event,
       amount ${eventsObj[i].returnValues[1]}`
    )
    localDBUpdateOrInsert(ETH_ADDRESS, eventsObj[i].returnValues[1], "Increase")
    break

    case 'Withdraw':
    console.log(
      `Withdraw event,
       cut share ${eventsObj[i].returnValues[1]}
       total share ${eventsObj[i].returnValues[2]}`
    )

    subWithdraw(eventsObj[i].returnValues[1], eventsObj[i].returnValues[2])
    break

    case 'Trade':
    console.log(
      `Trade event,
       src address ${eventsObj[i].returnValues[0]},
       dest address: ${eventsObj[i].returnValues[2]},
       amountSent ${eventsObj[i].returnValues[1]},
       amountRecieve ${eventsObj[i].returnValues[3]}
       `
    )
    localDBUpdateOrInsert(eventsObj[i].returnValues[2], eventsObj[i].returnValues[3], "Increase")
    localDBUpdateOrInsert(eventsObj[i].returnValues[0], eventsObj[i].returnValues[1], "Reduce")

    break

    case 'BuyPool':
    console.log(
      `Buy pool event,
       pool address ${eventsObj[i].returnValues[0]},
       amount ${eventsObj[i].returnValues[1]}`
    )
    localDBUpdateOrInsert(eventsObj[i].returnValues[0], eventsObj[i].returnValues[1], "Increase")
    break

    case 'SellPool':
    console.log(
      `Sell pool event,
       pool address ${eventsObj[i].returnValues[0]},
       amount ${eventsObj[i].returnValues[1]}`
    )

    localDBUpdateOrInsert(eventsObj[i].returnValues[0], eventsObj[i].returnValues[1], "Reduce")
    break

    case 'Loan':
    console.log(
      `Loan event,
       cToken token address ${eventsObj[i].returnValues[0]},
       amount ${eventsObj[i].returnValues[1]}`
    )

    localDBUpdateOrInsert(eventsObj[i].returnValues[0], eventsObj[i].returnValues[1], "Increase")
    break

    case 'Reedem':
    console.log(
      `Reedem event,
       cToken token address ${eventsObj[i].returnValues[0]},
       amount ${eventsObj[i].returnValues[1]}`
    )

    localDBUpdateOrInsert(eventsObj[i].returnValues[0], eventsObj[i].returnValues[1], "Reduce")
    break
    }
   }
  }
}


// store all data from parsed events
// sum amount
function localDBUpdateOrInsert(address, amount, type){
  const searchObj = localDB.filter((item) => {
    return item.address === address && item.type === type
  })

  if(searchObj.length > 0){
    // update amount
    let curAmount = new BigNumber(searchObj[0].amount)
    searchObj[0].amount = curAmount.plus(amount).toString()
  }else{
    // insert
    localDB.push(
      {address, amount, type}
    )
  }
}

// TODO
function compareBalanceFromContractAndLocalDB(){
  return
}


// sub withdraw share from each asset in DB
async function subWithdraw(cutShare, removedShare){
  let TOTAL_SHARES = new BigNumber(cutShare).plus(removedShare)

  localDB.forEach((item) => {
    let amount = new BigNumber(item.amount)
    item.amount = BigNumber(amount.minus(amount.multipliedBy(cutShare).dividedBy(TOTAL_SHARES))).toString()
  })

  console.log(localDB)
}



// increase (Buy tokens) - redduce (Sell tokens)
function subReduceFromIncrease(address){
  const increaseObj = localDB.filter((item) => {
    return item.address === address && item.type === "Increase"
  })

  const reduceObj = localDB.filter((item) => {
    return item.address === address && item.type === "Reduce"
  })

  if(increaseObj.length > 0 && reduceObj.length > 0){
    let curIncrease = new BigNumber(increaseObj[0].amount)
    // sub increase
    increaseObj[0].amount = curIncrease.minus(reduceObj[0].amount).toString()
    // reset reduce
    reduceObj[0].amount = 0
  }
}


function calculateTotalValueFromLocalDB(){
  localDB.forEach((item) => {
    subReduceFromIncrease(item.address)
  })

  result = localDB.filter((item) => {
    return item.type === "Increase"
  })
}


// test call
(async function main(){
  await runEvensChecker(FUND_ADDRESS, abi.FUND_ABI)
  calculateTotalValueFromLocalDB()

  fs.writeFileSync('./data.json', JSON.stringify(result, null, 2) , 'utf-8');
}())
