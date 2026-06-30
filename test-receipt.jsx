import React from 'react';
import { renderToString } from 'react-dom/server';
import { PrintReceipt } from './src/components/PrintReceipt.tsx';

try {
  console.log("Success");
} catch(e) {
  console.error("Fail", e);
}
