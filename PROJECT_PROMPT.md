# Padma POS - AI Review Prompt

*Copy and paste the text below to another AI (like ChatGPT, Claude, etc.) to have it review or understand the project.*

***

**System Role & Objective:**
You are an expert Senior Full-Stack Engineer and UI/UX Designer. I am providing you with the complete context of my project, "Padma POS," an offline-first Point of Sale and inventory management system designed for event decorators and suppliers. I would like you to review the architecture, look for potential bugs, suggest performance optimizations, and critique the UI/UX decisions based on modern design standards.

### Project Overview
Padma POS is a client-side React application. It handles local data via Zustand state and `localStorage` to ensure 100% offline functionality. When an internet connection is available, the app can selectively sync data (push/pull) to a Supabase backend to ensure cloud backups and multi-device parity.

### Tech Stack
- **Frontend Framework**: React 18, built with Vite and SWC.
- **Language**: TypeScript (Strict mode enabled).
- **Styling**: Tailwind CSS, Shadcn UI components (Radix UI primitives).
- **State Management**: Zustand (with Persist middleware).
- **Icons**: Lucide React.
- **Routing**: React Router DOM (`lazy` loading and `Suspense` implemented).
- **Data Synchronization**: Supabase (used strictly as a Backend-as-a-Service for cloud backups, NOT as a primary live database).

### Core Features & Business Logic
1. **Bills & Orders Management**:
   - Bills transition through states: **Quotations**, **Upcoming**, **Active**, **Pending**, and **Settled**.
   - **Cost Calculations**: The app supports cart-level discounts, item-specific discounts, and advance payments. Final costs are calculated by subtracting discounts and accumulated payments from the total item costs.
   - **Receipt Generation**: Printable receipts are styled natively using hidden print CSS (`@media print`), ensuring 58mm thermal printer compatibility.

2. **Inventory Tracking**:
   - Inventory items are categorized (e.g., Furniture & Seating, Props & Backdrops, Lighting).
   - Each item has `availableQuantity` and `totalQuantity`. 
   - When an order becomes "Active," the stock is deducted. When "Settled," stock is replenished.

3. **Employee Management**:
   - Role-based access control: **Admin**, **Manager**, and **Staff**.
   - The app has a Login screen that checks against the local Zustand store for authentication (no server required).
   - Certain features (like Database Sync, Deleting Bills) are restricted to Admins.

4. **Settings & Preferences**:
   - Dark/Light mode toggle (using `next-themes`).
   - Dynamic Custom UI Themes (Blue, Purple, Rose, Emerald).
   - Export Data: Generates `.csv` or full `.json` backups of all Zustand state locally without hitting a server.
   - Database Repair Tool: Generates SQL snippets for the user to run in Supabase if schemas fall out of sync.

### UI/UX Design System
- **Micro-interactions**: High emphasis on premium micro-interactions. Buttons use `active:scale-95`, lists use `animate-in fade-in slide-in-from-bottom-1 duration-200`, and hover states use `shadow-sm hover:shadow-md`.
- **Navigation Layouts**: Mobile-first design. Tabs use a modern floating "Chips" design (`flex-wrap gap-2 rounded-full`) instead of standard underline tabs.
- **Colors & Theming**: The app relies on Tailwind CSS variables (e.g., `bg-card`, `text-foreground`, `border-border`) so themes can be switched dynamically in `index.css`.

### Known Architectural Decisions & Trade-offs
1. **Monolithic Store**: All data (bills, inventory, employees, settings) lives in a single Zustand store (`useStore.ts`). This was chosen for ease of local persistence, but can cause excessive re-renders if components don't use selective state selectors (e.g., `const bills = useStore(state => state.bills)`).
2. **Offline-First Sync**: Syncing to Supabase is triggered manually or upon specific high-value actions (creating a bill). It operates via a "Push Local State to Cloud" and "Pull Cloud State to Local" paradigm. There is no real-time WebSocket subscription to prevent data conflicts while offline.

### Your Task
Based on this context, please analyze the project and provide:
1. **Performance Bottlenecks**: Identify areas where the React/Zustand architecture might slow down if the user reaches 10,000+ bills.
2. **Data Integrity Risks**: Are there race conditions in the offline-first sync model?
3. **UI/UX Critique**: Suggestions to improve the mobile Point-of-Sale experience for non-technical users.
4. **Code Quality Improvements**: Any standard React/TypeScript patterns that should be applied.

***
