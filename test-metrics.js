const { calculateCharges } = require('./backend/src/services/tradeMetrics');

const trade = {
  segment: 'options',
  instrument: 'OPTIDX',
  brokerageMode: 'flat_per_lot',
  side: 'buy',
  quantity: 2, // 2 lots
  lotSize: 15, // BankNifty
  entryPrice: 100,
  exitPrice: 150, // 50 points profit
  brokeragePercent: 20 // ₹20 per lot
};

console.log("Current output:", calculateCharges(trade));
