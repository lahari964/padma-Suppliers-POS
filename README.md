# Padma POS - Tenthouse & Event Rentals

A comprehensive Point of Sale (POS) and inventory management system designed specifically for tenthouse and event rental businesses. Built with React, TypeScript, Tailwind CSS, and powered by an offline-first architecture with real-time Supabase background syncing.

## Core Features

- **Robust Billing System**: Create and manage rental orders, track item quantities, and automatically calculate costs based on rental duration (days).
- **Return Management**: Process full, partial, and bulk returns. Support for tracking damages and applying damage charges.
- **Payment Tracking**: Record advance payments, multiple partial payments, and track outstanding balances.
- **Offline-First Auto-Sync Architecture**: The app writes all changes locally first, ensuring it functions seamlessly without an internet connection. Every update instantly triggers an automatic background sync to Supabase.
- **Secure PIN Authentication**: Employees log in securely using their registered mobile number and a 4-digit PIN. Passwords can be managed directly within the app.
- **Dynamic Calendar View**: Visually track upcoming events, expected returns, and dispatched items on a monthly calendar.
- **Print Receipts & Invoices**: Generate professional Standard A4 Invoices or Thermal Receipts (58mm, 80mm, 112mm) directly from the browser.
- **Inventory Management**: Real-time tracking of available vs dispatched inventory.

## Architecture & State Management

- **Frontend Framework**: React 18 powered by Vite.
- **Styling**: Tailwind CSS and shadcn/ui components.
- **State Management**: Zustand handles global state, persisting to `localStorage` to guarantee offline availability.
- **Database Backend**: Supabase (PostgreSQL) stores `bills`, `inventory`, and `employees`. 
- **Auto-Sync Engine**: Whenever a user modifies data (e.g., adding a payment, processing a return), the `useStore` hooks immediately trigger `syncUpToCloud` via the `@supabase/supabase-js` client, bypassing manual sync requirements.

## Requirements

- Node.js 18+ (LTS recommended)
- npm

## Getting Started

Install dependencies:
```bash
npm install
```

Run the development server:
```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start Vite in development mode
- `npm run build` - Create a production build
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint checks
- `npm run test` - Run Vitest tests
- `npx tsc --noEmit` - Run strict TypeScript compilation checks

## Environment Configuration
The application securely connects to Supabase using a `.env.local` configuration or pre-injected service credentials for frictionless zero-config execution.

## Verification Commands
To verify repository health before deploying:
```bash
npm run lint
npm run test
npm run build
npx tsc --noEmit
```
