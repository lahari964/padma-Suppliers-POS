# PadmaPOS - Official User Manual

Welcome to the **PadmaPOS** User Manual. This document provides a comprehensive guide on how to navigate and utilize the Padma Suppliers Point of Sale system. This is a living document and will be updated continuously as new features are added.

---

## 1. Dashboard Overview
The Dashboard acts as your central command center, giving you a real-time snapshot of your business operations.
- **Quick Overview:** Displays key daily metrics such as *Today's Dispatches*, *Today's Returns*, *Today's Collections*, and *Total Due Payments*.
- **Historical Revenue:** A 6-month bar chart aggregating actual collected payments to track business growth.
- **7-Day Rolling Window:** 
  - **Upcoming:** Orders scheduled for the next 7 days.
  - **Returns:** Items expected back within the next 7 days.
  - **Payments:** Promised payment dates approaching in the next 7 days.
- **Action Required:** Highlights overdue payments and events that require the billing clock to be manually started.

## 2. Managing Inventory
The **Inventory** tab allows you to manage the physical assets available for rent.
- View a complete list of items categorized by type (e.g., Furniture, Decor, Lighting).
- You can track the current stock, daily rental rate, and replacement value of each item.
- Use the quick search bar to locate specific items instantly.

## 3. Creating New Orders (Bills)
To create an order, navigate to the **New Bill** page.
- **Required Details:** You must input the *Customer Name* and a valid *Mobile Number*.
- **Event Scheduling:** Specify the *Event Date* and *Time*. 
  - *Note: If the Event Date is in the future, the order is automatically saved as an "Upcoming Order".*
- **Adding Items:** Use the searchable inventory panel on the right. Enter the quantity required and click the `+` button to stage them for the bill.
- **Optional Details:** Expand the optional section to record advance payments, estimated transportation charges, discounts, referral sources, and special delivery notes.
- Clicking **Create Rental Bill** generates the order and redirects you to the main Bills list.

## 4. Active Rentals & "Add Items"
Once a bill is created, you can modify it from the Customer Insights modal.
- **Adding Items to Order:** Click **"+ Add New Items to Order"** inside the modal. Search for any inventory item, input the quantity, and add it directly to an active or upcoming bill. The added items will go into the "Items To Dispatch" queue.

## 5. Dispatching Items & Starting Billing
PadmaPOS strictly separates the physical dispatch of items from the financial billing clock.
- **Partial/Full Dispatch:** Under "Items To Dispatch", enter the quantity you are physically sending to the venue and click "Process Selected Dispatches".
- **Starting the Clock:** Dispatching items does *not* automatically start charging the customer. Once the event officially begins, you must click the prominent **"Start Billing Now"** button in the modal. This transitions the order to **Active**.

## 6. Processing Returns & Payments
When an event concludes, you must log the returned items and settle the balance.
- **Receiving Returns:** In the Customer Insights modal, locate the active items. Enter the returned quantity and confirm the date/time of return.
  - *Pre-Billing Returns:* If items are returned *before* the "Start Billing" button was ever clicked, the system will ask if you want to charge for them, or process the return with 0 Days (No Billing).
- **Logging Payments:** Use the "Record Payment" input at the bottom of the modal to log partial or final payments.
- **Closing a Bill:** Once all items are returned and the balance is exactly ₹0, the bill automatically transitions to a **Paid/Settled** state.

## 7. Sharing Receipts & Communication
- **Share on WhatsApp:** Click **"Share on WhatsApp"** to generate a clear, professional text summary of the active bill (including dispatched items, payments, and balance) and send it directly to the customer.
- **PDF Receipts:** Click the **"Print PDF"** button to generate a printer-friendly invoice detailing all dispatched items, advances, and current balances.

## 8. System Settings & Data
The **Settings** page houses your administrative controls.
- Customize the business name, owner details, address, and GSTIN.
- **Data Export:** You can export your entire database as a JSON backup or a CSV spreadsheet. *Note: Data export requires an active connection to the cloud database.*

---
*Last Updated: 2026-06-11*

## 9. Calendar View (Operations Hub)
The Calendar View is your central hub for tracking the movement of your inventory across time.
- **Unified Month Grid:** View a complete layout of the month highlighting 3 core events:
  - 🔵 **Dispatches:** Scheduled send-outs of inventory for Upcoming orders.
  - 🔴 **Returns:** Expected return dates for items currently active at events.
  - 🟢 **Payments:** Promised payment dates for pending balances.
- **Daily Agenda:** Clicking any day will slide open the Daily Agenda Panel, showing a precise list of everything happening on that specific day.
- **Direct Workflow:** Click any event chip directly on the calendar or inside the Daily Agenda to instantly open the **Customer Insights Modal**, allowing you to dispatch, receive, or log payments without ever leaving the calendar.

## 10. Database Administration
The Database tab inside Settings provides high-level control for Admins.
- **Health Check:** Monitor live connectivity and perform diagnostic checks.
- **Repair Tool:** Access the raw SQL schema to manually structure your cloud tables if data ever falls out of sync.
- **Data Reset (Danger Zone):** A highly restricted capability to wipe the database and start fresh if an administrative reset is required.
