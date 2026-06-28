# Padma POS

Padma POS is a modern, offline-first Point of Sale (POS) and inventory management system designed for suppliers and event decorators. Built with a focus on speed, reliability, and mobile responsiveness, it allows businesses to seamlessly manage orders, quotations, inventory, and staff whether online or completely offline.

## Features

- **Offline-First Architecture**: Works entirely offline using robust local state management. All data is saved instantly to your device.
- **Cloud Synchronization**: Sync your local database to Supabase whenever you have an internet connection to keep your data backed up securely.
- **Order & Bill Management**: 
  - Track orders across different states: Upcoming, Active, Pending, Settled, and Quotations.
  - Automatically calculate cart-level and item-level discounts.
- **Inventory Tracking**: 
  - Manage categories like Furniture & Seating, Props & Backdrops, Lighting, and more.
  - Real-time stock alerts and quantity tracking.
- **Role-Based Access Control**: Manage employee access and permissions securely.
- **Premium UI/UX**: Designed with a sleek, responsive interface featuring dynamic animations, a dark mode toggle, and mobile-friendly interactions (using Shadcn/UI & Tailwind CSS).

## Tech Stack

- **Frontend**: React (Vite), TypeScript
- **Styling**: Tailwind CSS, Shadcn UI
- **State Management**: Zustand
- **Database / Sync**: Supabase (Backend-as-a-Service) for cloud backups
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository:
```bash
git clone https://github.com/lahari964/padma-Suppliers-POS.git
cd padma-pos
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`.

### Environment Variables
To enable cloud synchronization, create a `.env` file in the root directory and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
*Note: If you do not provide these keys, the app will continue to function perfectly in offline-only mode.*

## Build for Production

To build the application for production, run:
```bash
npm run build
```
The optimized production build will be output to the `dist` folder.

## License
Private Property - All rights reserved.
