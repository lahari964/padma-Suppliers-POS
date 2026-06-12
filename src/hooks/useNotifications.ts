import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { playNotificationSound } from '../lib/audioSynth';
import { Bill } from '../types';
import { parseISO, differenceInHours } from 'date-fns';

export function useNotifications() {
  const { bills, preferences } = useStore();
  const prevBillsRef = useRef<Bill[]>([]);
  const notifiedEventsRef = useRef<Set<string>>(new Set());

  // Helper to trigger notification
  const triggerNotification = (title: string, options: NotificationOptions, sound: string) => {
    if (preferences.pushEnabled && "Notification" in window && Notification.permission === "granted") {
      new Notification(title, options);
    }
    // Always play sound if configured, even if push is disabled
    if (sound && sound !== 'None' && sound !== 'Silent') {
      playNotificationSound(sound);
    }
  };

  // 1. Monitor State Changes (Action-based alerts)
  useEffect(() => {
    const prevBills = prevBillsRef.current;
    const currentBills = bills;

    if (prevBills.length > 0 && currentBills.length > prevBills.length) {
      // New Bill Created
      if (preferences.alerts?.newBillCreated) {
        const newBill = currentBills[0]; // Assuming added to top
        if (!prevBills.find(b => b.id === newBill.id)) {
          triggerNotification(
            "New Rental Created", 
            { body: `Bill ${newBill.id} created for ${newBill.customerName}.` }, 
            preferences.notificationSound
          );
        }
      }
    } else if (prevBills.length > 0) {
      // Check for updates
      currentBills.forEach(currentBill => {
        const prevBill = prevBills.find(b => b.id === currentBill.id);
        if (prevBill) {
          // Item Dispatched
          if (preferences.alerts?.itemDispatched) {
            if (prevBill.status === 'Upcoming' && (currentBill.status === 'Active' || currentBill.status === 'Partially Active')) {
              triggerNotification(
                "Items Dispatched", 
                { body: `Items for ${currentBill.customerName} have been marked as sent.` }, 
                preferences.notificationSound
              );
            }
          }

          // Item Returned
          if (preferences.alerts?.itemReturned) {
            const prevReturns = prevBill.returnHistory?.length || 0;
            const currentReturns = currentBill.returnHistory?.length || 0;
            if (currentReturns > prevReturns) {
              triggerNotification(
                "Items Returned", 
                { body: `Items have been received back from ${currentBill.customerName}.` }, 
                preferences.notificationSound
              );
            }
          }
        }
      });
    }

    prevBillsRef.current = currentBills;
  }, [bills, preferences]);

  // 2. Monitor Time-based events (Advance Notice alerts)
  useEffect(() => {
    const checkTimeBasedAlerts = () => {
      const now = new Date();
      
      let hoursThreshold = 24; // Default 1 day
      if (preferences.advanceNoticeTiming === '1 hour') hoursThreshold = 1;
      else if (preferences.advanceNoticeTiming === '3 hours') hoursThreshold = 3;
      else if (preferences.advanceNoticeTiming === '2 days') hoursThreshold = 48;

      bills.forEach(bill => {
        // Upcoming Orders
        if (preferences.alerts?.upcomingOrders && bill.status === 'Upcoming' && bill.eventDate) {
          const eventDate = parseISO(bill.eventDate);
          const diff = differenceInHours(eventDate, now);
          
          const eventKey = `upcoming-${bill.id}`;
          if (diff > 0 && diff <= hoursThreshold && !notifiedEventsRef.current.has(eventKey)) {
            triggerNotification(
              "Upcoming Dispatch Reminder", 
              { body: `Order for ${bill.customerName} is due for dispatch within ${preferences.advanceNoticeTiming}.` }, 
              preferences.notificationSound
            );
            notifiedEventsRef.current.add(eventKey);
          }
        }

        // Expected Returns
        if (preferences.alerts?.expectedReturns && (bill.status === 'Active' || bill.status === 'Partially Active') && bill.expectedReturnDate) {
          const returnDate = parseISO(bill.expectedReturnDate);
          const diff = differenceInHours(returnDate, now);
          
          const eventKey = `return-${bill.id}`;
          if (diff > 0 && diff <= hoursThreshold && !notifiedEventsRef.current.has(eventKey)) {
            triggerNotification(
              "Expected Return Reminder", 
              { body: `Items from ${bill.customerName} are expected back within ${preferences.advanceNoticeTiming}.` }, 
              preferences.notificationSound
            );
            notifiedEventsRef.current.add(eventKey);
          }
        }

        // Payment Due
        if (preferences.alerts?.paymentDue && bill.status === 'Pending' && bill.paymentPromiseDate) {
          const paymentDate = parseISO(bill.paymentPromiseDate);
          const diff = differenceInHours(paymentDate, now);
          
          const eventKey = `payment-${bill.id}`;
          // For payments, notify on the day of (threshold 24h)
          if (diff > 0 && diff <= 24 && !notifiedEventsRef.current.has(eventKey)) {
            triggerNotification(
              "Payment Due Today", 
              { body: `Promised payment from ${bill.customerName} is due.` }, 
              preferences.notificationSound
            );
            notifiedEventsRef.current.add(eventKey);
          }
        }
      });
    };

    // Check immediately on mount, then every 5 minutes
    checkTimeBasedAlerts();
    const interval = setInterval(checkTimeBasedAlerts, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [bills, preferences]);
}
