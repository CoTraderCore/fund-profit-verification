const abi = require('./abi.js')
const getEvent = require('./getEvent.js')
const _ = require('lodash')
const BigNumber = require('bignumber.js')

const FUND_ADDRESS = "0xcA7abB776788D86c6acF42DE07229f9c5798E38C"
const localDB = []


// events parser
async function runEvensChecker(address, abi){
  let eventsObj = await getEvent(address, abi, 0, 'allEvents')

  // Check if some events in case happen for this fund address
  if(!_.isEmpty(eventsObj)){

  for(let i =0; i < eventsObj.length; i++){
  const EventName = eventsObj[i].event

  switch(EventName){
    case 'Trade':
    console.log(
      `Trade event,
       src address ${eventsObj[i].returnValues[0]},
       dest address: ${eventsObj[i].returnValues[2]},
       amount ${eventsObj[i].returnValues[1]}`
    )
    localDBUpdateOrInsert(eventsObj[i].returnValues[0], eventsObj[i].returnValues[1], "Increase")
    localDBUpdateOrInsert(eventsObj[i].returnValues[2], eventsObj[i].returnValues[1], "Reduce")
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

// increase - redduce
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
}


// TODO
function compareBalanceFromContractAndLocalDB(){
  return
}


// test call
(async function main(){
  await runEvensChecker(FUND_ADDRESS, abi.FUND_ABI)
  console.log(localDB)
  calculateTotalValueFromLocalDB()
  console.log(localDB)
}())
