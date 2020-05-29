const abi = require('./abi.js')
const getEvent = require('./getEvent.js')
const _ = require('lodash')


const FUND_ADDRESS = "0xcA7abB776788D86c6acF42DE07229f9c5798E38C"
const localDB = []

// store all data from parsed events
// sum amount
function localDBUpdateOrInsert(address, amount, type){
  const searchObj = localDB.filter((item) => {
    return item.address === address && item.type === type
  })

  if(searchObj.length > 0){
    // update amount
    searchObj[0].amount = searchObj[0].amount + amount
  }else{
    // insert
    localDB.push(
      {address, amount, type}
    )
  }
}


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
    localDBUpdateOrInsert(eventsObj[i].returnValues[0], eventsObj[i].returnValues[1], "Sell trade")
    localDBUpdateOrInsert(eventsObj[i].returnValues[2], eventsObj[i].returnValues[1], "Buy trade")
    break

    case 'BuyPool':
    console.log(
      `Buy pool event,
       pool address ${eventsObj[i].returnValues[0]},
       amount ${eventsObj[i].returnValues[1]}`
    )
    localDBUpdateOrInsert(eventsObj[i].returnValues[0], eventsObj[i].returnValues[1], "Buy pool")
    break

    case 'SellPool':
    console.log(
      `Sell pool event,
       pool address ${eventsObj[i].returnValues[0]},
       amount ${eventsObj[i].returnValues[1]}`
    )

    localDBUpdateOrInsert(eventsObj[i].returnValues[0], eventsObj[i].returnValues[1], "Sell pool")
    break

    case 'Loan':
    console.log(
      `Loan event,
       cToken token address ${eventsObj[i].returnValues[0]},
       amount ${eventsObj[i].returnValues[1]}`
    )

    localDBUpdateOrInsert(eventsObj[i].returnValues[0], eventsObj[i].returnValues[1], "Loan")
    break

    case 'Reedem':
    console.log(
      `Reedem event,
       cToken token address ${eventsObj[i].returnValues[0]},
       amount ${eventsObj[i].returnValues[1]}`
    )

    localDBUpdateOrInsert(eventsObj[i].returnValues[0], eventsObj[i].returnValues[1], "Reedem")
    break
    }
   }
  }
}

// TODO
function calculateTotalValueFromLocalDB(){
  return
}

// TODO
function compareBalanceFromContractAndLocalDB(){
  return
}


// test call
(async function main(){
  await runEvensChecker(FUND_ADDRESS, abi.FUND_ABI)
  console.log(localDB)
}())
