const React = require('react');
const ReactDOMServer = require('react-dom/server');
require('@babel/register')({ presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'], extensions: ['.ts', '.tsx'] });
const { PrintReceipt } = require('./src/components/PrintReceipt.tsx');
try {
  const bill = { items: [], payments: [], totalCost: 100, transportationCharges: null, discount: undefined };
  console.log("Success", !!PrintReceipt);
} catch (e) {
  console.error("Crash:", e);
}
