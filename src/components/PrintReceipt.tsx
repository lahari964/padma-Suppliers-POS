import React from 'react';
import { createPortal } from 'react-dom';
import { Bill } from '../types';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';
import { getBillDisplayInfo } from '../hooks/useBillCalculations';

export const PrintReceipt = ({ bill }: { bill: Bill }) => {
  const { preferences, inventory } = useStore();
  const biz = preferences.businessDetails || {
    name: 'Padma POS',
    tagline: '',
    address: '',
    phone: '',
    terms: '',
    signatureLabel: 'Authorized Signatory'
  };

  const isThermal = preferences.receiptTemplate.includes('Thermal');
  const thermalSize = preferences.receiptTemplate.includes('112') ? '112mm' : preferences.receiptTemplate.includes('58') ? '58mm' : '80mm';
  const paid = bill.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
  const balance = Math.max(0, bill.totalCost - paid - (bill.discount || 0));

  let totalOverrideDifference = 0;
  const enrichedItems = bill.items.map(item => {
    const originalItem = inventory.find(i => i.id === item.inventoryId);
    const actualPrice = originalItem ? originalItem.price : item.price;
    // Only show "discounted" prices if we actually gave them a cheaper rate.
    // If we charged them more than usual, hide the original price so it doesn't look like we looted them.
    const isCustom = actualPrice > item.price;
    const itemDays = item.days || 1;
    if (isCustom) {
      totalOverrideDifference += (actualPrice - item.price) * item.qtyIssued * itemDays;
    }
    return { ...item, actualPrice, isCustom, itemDays };
  });

  if (isThermal) {
    return createPortal(
      <div id="print-section" className="hidden print:block font-mono text-black mx-auto text-[12px] leading-tight p-2" style={{ width: thermalSize, maxWidth: thermalSize }}>
        <div className="text-center mb-4 flex flex-col items-center">
          <img src="/logo.png" alt="Padma Suppliers Logo" className="w-12 h-12 mb-2 object-contain filter grayscale" />
          <h1 className="text-lg font-bold uppercase">{biz.name}</h1>
          {biz.tagline && <p className="text-xs">{biz.tagline}</p>}
          {biz.address && <p className="text-xs mt-1">{biz.address}</p>}
          {biz.phone && <p className="text-xs">Ph: {biz.phone}</p>}
          {biz.landline && <p className="text-xs">Landline: {biz.landline}</p>}
        </div>

        <div className="border-b border-dashed border-black pb-2 mb-2">
          <p><strong>Order ID:</strong> {bill.id}</p>
          <p><strong>Date:</strong> {format(new Date(), 'dd MMM yyyy HH:mm')}</p>
          <p><strong>Customer:</strong> {bill.customerName}</p>
          {bill.mobile && <p><strong>Phone:</strong> {bill.mobile}</p>}
          <p><strong>Event Date:</strong> {bill.eventDate ? bill.eventDate.split('-').reverse().join('-') : 'N/A'}</p>
        </div>

        <table className="w-full text-left mb-2">
          <thead>
            <tr className="border-b border-dashed border-black">
              <th className="py-1">Item</th>
              <th className="py-1 text-center">Qty</th>
              <th className="py-1 text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {enrichedItems.map((item, idx) => (
              <tr key={idx}>
                <td className="py-1">
                  {item.name}
                  {item.isCustom && <span className="block text-[10px] text-gray-500 line-through">₹{item.actualPrice}</span>}
                </td>
                <td className="py-1 text-center">{item.qtyIssued}</td>
                <td className="py-1 text-right">
                  {item.isCustom && <span className="block text-[10px] text-gray-500 line-through">₹{item.actualPrice * item.qtyIssued * item.itemDays}</span>}
                  ₹{item.price * item.qtyIssued * item.itemDays}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {bill.damageDetails && bill.damageDetails.length > 0 && (
          <div className="mt-2 mb-2 border-t border-dashed border-black pt-2">
            <p className="font-bold pb-1 text-center">Damaged / Missing Items</p>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-dashed border-black">
                  <th className="py-1">Item</th>
                  <th className="py-1 text-center">Qty</th>
                  <th className="py-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {bill.damageDetails.map((dmg, idx) => (
                  <tr key={idx}>
                    <td className="py-1">{dmg.name}</td>
                    <td className="py-1 text-center">{dmg.qty}</td>
                    <td className="py-1 text-right">₹{dmg.totalCharge}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-dashed border-black pt-2 mb-4 space-y-1 text-right">
          <p>Base Amount: <strong>₹{bill.totalCost - (bill.damageCharges || 0)}</strong></p>
          {totalOverrideDifference > 0 ? <p className="text-gray-600">Rate Savings: <strong>₹{totalOverrideDifference}</strong></p> : null}
          {bill.damageCharges ? <p>Damage Charges: <strong>+₹{bill.damageCharges}</strong></p> : null}
          <p>Total Cost: <strong>₹{bill.totalCost}</strong></p>
          {bill.discount ? <p>Discount: <strong>-₹{bill.discount}</strong></p> : null}
          <p>Paid: <strong>₹{paid}</strong></p>
          <p className="text-sm border-t border-dashed border-black pt-1 mt-1">Balance Due: <strong>₹{balance}</strong></p>
        </div>

        {biz.terms && (
          <div className="mb-6 text-[10px] text-justify whitespace-pre-wrap">
            <strong>Terms:</strong><br/>
            {biz.terms}
          </div>
        )}

        <div className="text-center mt-8 pt-4 border-t border-dashed border-black">
          <p>Thank you for your business!</p>
        </div>
      </div>,
      document.body
    );
  }

  const displayStatus = getBillDisplayInfo(bill).status;
  const isEstStatus = displayStatus === 'Upcoming' || displayStatus === 'Active' || displayStatus === 'Partially Active';
  const isReturnedStatus = displayStatus === 'Pending' || displayStatus === 'Settled';

  const getReturnDate = (item: any) => {
    const itemReturns = bill.returnHistory?.filter(r => r.items.some(i => i.name === item.name));
    if (itemReturns && itemReturns.length > 0) {
      const lastReturn = itemReturns[itemReturns.length - 1];
      try { return format(new Date(lastReturn.date), 'dd-MM-yyyy'); } catch(e){}
    }
    return '';
  };

  // A4 Layout - Exactly matching screenshots
  return createPortal(
    <div id="print-section" className="hidden print:block font-sans text-black bg-white w-full max-w-[210mm] mx-auto p-4 sm:p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex gap-4">
          <div className="w-12 h-12 shrink-0">
            <img src="/logo.png" alt="Padma Suppliers Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-4xl font-serif font-bold uppercase tracking-tight leading-none mb-2">{biz.name || 'PADMA\nSUPPLIERS'}</h1>
            <p className="text-sm font-medium">{biz.address || 'Ganugapalem, Ongole-523001'}</p>
            <p className="text-xs text-gray-500 mt-0.5">{biz.tagline || 'Premium Tenthouse & Event Rentals'}</p>
            {biz.phone && <p className="text-xs text-gray-500">Ph: {biz.phone}</p>}
            {biz.landline && <p className="text-xs text-gray-500">Landline: {biz.landline}</p>}
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-base">Invoice #: {bill.id}</p>
          <p className="text-xs text-gray-500 mt-1">Generated:</p>
          <p className="text-xs text-gray-500">{format(new Date(), 'dd MMM yyyy, hh:mm a')}</p>
        </div>
      </div>

      {/* Customer Info */}
      <div className="border-t-2 border-b-2 border-black py-3 mb-6 space-y-1 text-sm">
        <p><span className="font-bold">Customer Name:</span> {bill.customerName}</p>
        <p><span className="font-bold">Mobile:</span> {bill.mobile}</p>
        {bill.address && <p><span className="font-bold">Address:</span> {bill.address}</p>}
      </div>

      {/* Items Table */}
      <table className="w-full text-left mb-6 border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="py-2 px-1 font-bold">Equipment Returned</th>
            <th className="py-2 px-1 font-bold text-center">Qty</th>
            <th className="py-2 px-1 font-bold text-center">Time</th>
            <th className="py-2 px-1 font-bold text-center">Rate</th>
            <th className="py-2 px-1 font-bold text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="align-top">
          {enrichedItems.map((item, idx) => {
            const retDate = getReturnDate(item);
            const amount = item.price * item.qtyIssued * item.itemDays;
            const actualAmount = item.actualPrice * item.qtyIssued * item.itemDays;
            return (
              <tr key={idx} className="border-b border-gray-200">
                <td className="py-4 px-1 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{item.name}</span>
                    {isReturnedStatus && <span className="text-[9px] text-gray-500 border border-gray-300 rounded px-1 py-0.5 uppercase tracking-wide">Returned</span>}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {isReturnedStatus && retDate ? (
                      `Issued: ${format(new Date(item.issueDate), 'dd-MM-yyyy')} | Ret: ${retDate} | By: ${item.handledBy || bill.createdBy || 'Admin'}`
                    ) : (
                      `Issued: ${format(new Date(item.issueDate), 'dd-MM-yyyy')} | By: ${item.handledBy || bill.createdBy || 'Admin'}`
                    )}
                  </div>
                </td>
                <td className="py-4 px-1 text-center">{item.qtyIssued}</td>
                <td className="py-4 px-1 text-center">{item.itemDays} Days</td>
                <td className="py-4 px-1 text-center">
                  {item.isCustom ? (
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-gray-400 line-through">₹{item.actualPrice}/day</span>
                      <span>₹{item.price}/day</span>
                    </div>
                  ) : (
                    <span>₹{item.price}/day</span>
                  )}
                </td>
                <td className={`py-4 px-1 text-right ${isEstStatus ? 'italic text-gray-500' : 'font-medium'}`}>
                  {item.isCustom ? (
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-gray-400 line-through">₹{actualAmount}</span>
                      <span>₹{amount} {isEstStatus ? '(Est.)' : ''}</span>
                    </div>
                  ) : (
                    <span>₹{amount} {isEstStatus ? '(Est.)' : ''}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Totals Section */}
      <div className="flex justify-end">
        <div className="w-72">
          {/* Subtotals */}
          <div className="space-y-2 mb-2 text-sm font-bold">
            <div className="flex justify-between">
              <span>{isEstStatus ? 'Items Total (Est.):' : 'Items Total:'}</span>
              <span>₹{bill.totalCost}</span>
            </div>
            
            {totalOverrideDifference > 0 && (
              <div className="flex justify-between text-gray-500 font-normal">
                <span>Rate Savings:</span>
                <span>₹{totalOverrideDifference}</span>
              </div>
            )}
            
            {bill.payments && bill.payments.length > 0 ? (
              <div className="pt-2">
                <span className="block mb-1">Payments Received:</span>
                {bill.payments.map((p, i) => (
                  <div key={i} className="flex justify-between text-gray-600 font-normal ml-2">
                    <span>{format(new Date(p.date), 'dd-MM-yyyy')}:</span>
                    <span>- ₹{p.amount}</span>
                  </div>
                ))}
                <div className="flex justify-between mt-1 pt-1 border-t border-gray-200">
                  <span>Total Paid:</span>
                  <span>- ₹{paid}</span>
                </div>
              </div>
            ) : (
              <div className="flex justify-between">
                <span>Advance Received:</span>
                <span>- ₹{paid}</span>
              </div>
            )}

            {bill.transportationCharges && bill.transportationCharges > 0 ? (
              <div className="flex justify-between pt-2">
                <span>Transportation:</span>
                <span>₹{bill.transportationCharges}</span>
              </div>
            ) : null}

            {bill.discount && bill.discount > 0 ? (
              <div className="flex justify-between pt-2">
                <span>Discount:</span>
                <span>- ₹{bill.discount}</span>
              </div>
            ) : null}
          </div>

          {/* Grand Total */}
          <div className="flex justify-between items-center border-t-2 border-black pt-2 pb-2">
            <span className="font-bold text-lg">Grand Total:</span>
            <span className="font-bold text-xl">₹{bill.totalCost}</span>
          </div>

          {/* Balance */}
          <div className="flex justify-between items-center pt-2">
            <span className="font-bold text-sm">{isEstStatus ? 'Est. Balance Due:' : 'Final Balance:'}</span>
            <span className="font-bold text-sm">₹{balance}</span>
          </div>
        </div>
      </div>

      {/* Footer Message */}
      <div className="text-center mt-8 text-sm">
        {isReturnedStatus ? (
          <p>All items returned. Thank you for choosing {biz.name || 'Padma Suppliers'}!</p>
        ) : (
          <p>Thank you for choosing {biz.name || 'Padma Suppliers'}!</p>
        )}
      </div>

    </div>,
    document.body
  );
};
