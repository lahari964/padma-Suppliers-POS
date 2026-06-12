import { useState } from 'react';
import { Search, BookOpen, ChevronDown, Package, FileText, Settings, Users, Calendar as CalendarIcon, UserCircle, Activity, Plus, Download, Database } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const FAQ_DATA = [
  {
    category: "1. Login & Basics",
    icon: <UserCircle className="w-5 h-5 text-indigo-500" />,
    items: [
      { q: "How do I log into the system?", a: "When you open the app, you will see a Login screen. Click on your role (Admin, Manager, or Staff), select your name, and enter your 4-digit PIN to access the system." },
      { q: "What happens if I close the browser or close the application?", a: "For security reasons, your session is temporary (saved in 'sessionStorage'). If you completely close your browser or the application tab, you will be automatically logged out. When you open the link again, you will be redirected back to the Login page." },
      { q: "How do I log out manually?", a: "Click on your profile name/avatar at the top right corner of the screen to open the 'My Account' menu. Then, click the red 'Logout' button at the bottom of the menu. This will securely log you out of the system." },
      { q: "What happens if I click the 'Padma Suppliers' logo at the top left?", a: "Clicking the logo acts as a 'Home' button and will instantly return you to the Dashboard from anywhere in the app." },
      { q: "What happens if I enter the wrong PIN?", a: "The system will show an 'Invalid PIN' error. If you forget your PIN, you must ask an Admin to reset it for you from the Settings page." },
      { q: "How do I switch between Light and Dark mode?", a: "Go to the Settings page and select the 'General' tab. You will find a toggle switch for 'Dark Mode'. Click it to instantly switch between light and dark themes." },
      { q: "What does the 'Offline' red dot at the top right mean?", a: "It means your app is not connected to the cloud database. You can still use the app normally (create bills, add inventory), and all data is saved locally on your computer." }
    ]
  },
  {
    category: "2. The Dashboard",
    icon: <Activity className="w-5 h-5 text-emerald-500" />,
    items: [
      { q: "What is the Dashboard?", a: "The Dashboard is the first screen you see after logging in. It gives you a quick summary of your business for the current day." },
      { q: "What does 'Total Revenue' show?", a: "It shows the total amount of money (advance payments + final settlements) collected TODAY. It resets to zero at midnight." },
      { q: "What does 'Active Bills' show?", a: "It shows the total number of customers who currently have rented items that have not yet been returned." },
      { q: "What does 'Expected Returns' show?", a: "It shows the number of active bills where the agreed 'Return Date' is exactly today (or earlier, meaning they are overdue)." },
      { q: "What is the 'Recent Activity' table?", a: "It is a quick list of the last 5 bills you created. You can click on any of them to view the full details." },
      { q: "How can I see a customer's entire history?", a: "In the Recent Activity table or Bills tab, simply click on the customer's name! This opens 'Customer Insights', a powerful screen showing their total money spent, active rentals, and past history." },
      { q: "Why are all the numbers zero?", a: "If you just started using the software or if there is no activity for today, the numbers will be zero. They will update as soon as you create a bill." }
    ]
  },
  {
    category: "3. Creating a New Bill (Step-by-step)",
    icon: <Plus className="w-5 h-5 text-blue-500" />,
    items: [
      { q: "How do I start creating a new bill?", a: "Click 'New Bill' in the left sidebar menu. This opens the bill creation form." },
      { q: "How do I enter the customer's details?", a: "In the top section, type the customer's Full Name into the first box, and their 10-digit Mobile Number into the second box." },
      { q: "How do I set the Dispatch Date?", a: "Click the calendar icon next to 'Dispatch Date'. A calendar will pop up. Click the exact date the customer is taking the items." },
      { q: "How do I set the Return Date?", a: "Click the calendar icon next to 'Return Date' and select the date the customer promises to bring the items back." },
      { q: "How do I add items to the bill?", a: "Scroll down to the 'Inventory Selection' section. Use the 'Search inventory...' box to find an item. Click the '+' button next to the item to add it to the bill." },
      { q: "How do I increase or decrease the quantity of an item?", a: "Once added, the item appears in the 'Selected Items' list. Use the '+' and '-' buttons next to the item to change the quantity." },
      { q: "How do I remove an item from the bill?", a: "Click the red trash can icon next to the item in the 'Selected Items' list." },
      { q: "How do I apply a discount?", a: "Below the selected items, find the 'Discount' box. You can type a flat amount (like 500) to subtract it from the total." },
      { q: "How do I record an advance payment?", a: "In the 'Payments' section, click 'Add Payment'. Enter the amount the customer is paying right now. This is subtracted from their pending balance." },
      { q: "How do I finish and save the bill?", a: "Scroll to the very bottom and click the large blue 'Create Bill' button. A success message will appear." },
      { q: "Can I enter a bill for a transaction that happened in the past (Backdating)?", a: "Yes! If you forgot to enter a bill yesterday, you can create it today. When creating the bill, simply click the calendar icon next to 'Dispatch Date' and select yesterday's date. The system will record it as starting on that date." }
    ]
  },
  {
    category: "4. Managing Bills & Returns",
    icon: <FileText className="w-5 h-5 text-indigo-500" />,
    items: [
      { q: "How do I see all my past and current bills?", a: "Click 'Bills' in the left sidebar menu. This shows a table of all bills ever created." },
      { q: "How do I search for a specific customer's bill?", a: "Use the search bar at the top of the Bills page. Type their name or mobile number, and the list will filter instantly." },
      { q: "How do I view the full details of a bill?", a: "Find the bill in the table and click the 'View' button (eye icon) on the far right. A popup will show all items, dates, and payments." },
      { q: "How do I record partial payments?", a: "Inside the Bill Details popup, click the 'Add Payment' button. Enter the amount they paid and select 'Cash', 'UPI', or 'Bank'. The system will instantly log it with today's date and reduce their pending balance." },
      { q: "How do I print a receipt for a customer?", a: "Click the 'Print' button next to the bill. A perfect print layout will instantly generate containing your store's logo. It dynamically changes its title based on the status (Upcoming, Active, Settled). It uses your browser's native print function for maximum reliability and speed!" },
      { q: "How do I instantly message the customer via WhatsApp?", a: "Inside the Bill Details popup, simply click the green 'WhatsApp' button. It will automatically open WhatsApp with a pre-written message containing their bill details, total cost, and pending balance. No typing required!" },
      { q: "How do I mark items as returned?", a: "Find the active bill in the table and click 'Process Return'. A window will ask you to confirm the return date and collect any final pending payment." },
      { q: "How do I charge a late fee?", a: "When you click 'Process Return', there is an option to add additional charges before you finalize the settlement." },
      { q: "Can I manage or change the Return Date to the past or future?", a: "Yes! When processing a return, you do not have to use today's date. You can freely edit the 'Return Date' field to a date in the past (if they returned it yesterday but you forgot to log it) or the future. The system will adjust calculations based on the date you manually select." },
      { q: "How do I delete a bill?", a: "Find the bill, click the three dots (⋮) on the right, and select 'Delete'. Warning: This is permanent!" }
    ]
  },
  {
    category: "5. Inventory Management",
    icon: <Package className="w-5 h-5 text-amber-500" />,
    items: [
      { q: "How do I view my inventory?", a: "Click 'Inventory' in the left sidebar menu. You will see a list of all your products." },
      { q: "How do I add a completely new product?", a: "Click the blue 'Add New Item' button at the top right. A popup will appear." },
      { q: "What should I type in 'Item Name'?", a: "Type the exact name of the product (e.g., 'Plastic Chair - Red'). Make it descriptive so staff can find it easily." },
      { q: "What should I type in 'Category'?", a: "Type a group name like 'Chairs', 'Tents', or 'Lights' to keep things organized." },
      { q: "What is 'Total Quantity'?", a: "This is the physical number of units you own in your business. Enter the exact count." },
      { q: "What is 'Daily Rental Rate'?", a: "Enter the standard price you charge to rent this item out for ONE day." },
      { q: "How do I save the new product?", a: "Click the 'Save Item' button at the bottom of the popup." },
      { q: "How do I change the price of a product?", a: "Find the product in the list, click the 'Edit' button (pencil icon), change the Daily Rate, and click Save." },
      { q: "How do I fix a broken or permanently lost item?", a: "Click the 'Edit' button next to the item and reduce the 'Total Quantity'. If you had 50 chairs and 2 broke, change it to 48. This prevents staff from renting out broken chairs." },
      { q: "Why is the 'Available' number lower than 'Total'?", a: "Because some items are currently rented out on Active Bills. When the customer returns them, the Available number will go back up automatically." }
    ]
  },
  {
    category: "6. Using the Calendar",
    icon: <CalendarIcon className="w-5 h-5 text-teal-500" />,
    items: [
      { q: "How do I open the Calendar?", a: "Click 'Calendar' in the left sidebar menu." },
      { q: "What is on the left side of the calendar screen?", a: "The left side shows a mini-calendar grid, like a standard wall calendar. You can click any day to see what is happening on that day." },
      { q: "What is on the right side of the calendar screen?", a: "The right side shows a detailed list of all bills related to the date you clicked on the left." },
      { q: "What does a Gray dot under a date mean?", a: "It means a bill was created on that specific date." },
      { q: "What does a Blue dot under a date mean?", a: "It means items are scheduled to be Dispatched (given to the customer) on that date." },
      { q: "What does an Orange dot under a date mean?", a: "It means items are Expected to Return from a customer on that date." },
      { q: "How do I change the month?", a: "Click the small left (<) and right (>) arrows at the top of the mini-calendar to flip through months." }
    ]
  },
  {
    category: "7. Settings: General & Receipts",
    icon: <Settings className="w-5 h-5 text-slate-500" />,
    items: [
      { q: "How do I access General Settings?", a: "Click 'Settings' in the left sidebar, then click the 'General' tab in the inner menu." },
      { q: "How do I change the store name printed on receipts?", a: "Find the 'Business Name' box, delete the old text, type your new store name. It saves automatically." },
      { q: "How do I change the Tagline?", a: "Find the 'Tagline' box and type your slogan (e.g., 'Premium Quality Since 1977')." },
      { q: "How do I update my store address?", a: "Find the 'Business Address' box and type your full street address." },
      { q: "How do I add multiple phone numbers?", a: "Find the 'Contact Number(s)' box and type all your numbers separated by commas (e.g., '+91 9000000000, 08592-200000')." },
      { q: "How do I change the Terms & Conditions?", a: "Scroll to the 'Terms & Conditions' large text box and type out all your rules (e.g., late fees, damages). This text is printed at the bottom of every receipt." },
      { q: "How do I switch to a Thermal Printer format?", a: "Under 'Print Format', click the 'Default Paper Size' dropdown and select 'Thermal Printer (80mm)'. When you print bills, they will now be formatted as long, narrow receipts perfectly sized for thermal machines, complete with your logo!" },
      { q: "What is 'Compact Table View'?", a: "It is a toggle switch. If you turn it ON, every single table across the entire app (Bills, Inventory, Staff) instantly shrinks its padding. This allows you to see many more rows of data on your screen at once without having to scroll!" }
    ]
  },
  {
    category: "8. Settings: Staff Management",
    icon: <Users className="w-5 h-5 text-purple-500" />,
    items: [
      { q: "Who can manage Staff?", a: "Only Admins can access the Staff tab in Settings." },
      { q: "How do I open Staff Management?", a: "Click 'Settings' in the sidebar, then click 'Staff' in the inner menu." },
      { q: "How do I add a new employee?", a: "Click the blue 'Add Employee' button. Fill in their Full Name, Mobile Number, select their Role (Admin/Manager/Staff), and type a 4-digit PIN. Click 'Create Account'." },
      { q: "What does the employee use to login?", a: "They will use the exact Mobile Number you typed for them, along with the 4-digit PIN you set." },
      { q: "How do I instantly fire or disable an employee?", a: "Find the employee in the table and click the three dots (⋮) on the right. Select 'Deactivate User'. That's it! Their status instantly changes to 'Inactive' (gray text) and they immediately lose the ability to log in. Their historical audit logs remain perfectly intact." },
      { q: "How do I un-block a disabled employee?", a: "Click the three dots (⋮) next to an inactive employee and select 'Reactivate User'. Their status changes back to 'Active' (emerald text) and they can log in again." },
      { q: "Why won't the system let me deactivate myself?", a: "The system prevents you from deactivating the last Admin account. If you do, nobody would be able to access the Settings page ever again." }
    ]
  },
  {
    category: "9. Settings: Exporting Data & Notifications",
    icon: <Download className="w-5 h-5 text-rose-500" />,
    items: [
      { q: "How do I open Export Settings?", a: "Click 'Settings' -> 'Export / Download' tab." },
      { q: "How do I download my data to Excel/CSV?", a: "Under 'Custom Date Range Report', select a Start Date and an End Date. Click the blue 'Download CSV' button." },
      { q: "How do I make a full backup of my entire software?", a: "Click the large 'Download Full JSON Backup' button. It will save a file called 'padmapos-backup.json' to your computer. Keep this file safe!" },
      { q: "How do I turn on Desktop Notifications?", a: "Go to Settings -> Notifications. Click the switch next to 'Browser Push Notifications'. Your web browser will ask 'Allow notifications?'. Click 'Allow'." },
      { q: "How do I change the notification sound?", a: "In the Notifications tab, click the 'Notification Sound' dropdown and pick a sound like 'Chime' or 'Ping'. It will play a test sound immediately." }
    ]
  },
  {
    category: "10. Troubleshooting, Optimizations & Database",
    icon: <Database className="w-5 h-5 text-cyan-500" />,
    items: [
      { q: "Why is the app loading so much faster now?", a: "We recently heavily optimized the software by permanently removing clunky PDF-generation libraries. By removing these, the app's bundle size was reduced by nearly 2 Megabytes, resulting in lightning-fast load times even on slow mobile data connections! We now use the browser's ultra-fast native print function instead." },
      { q: "What does 'Please fill all required fields' mean?", a: "This error pops up if you try to save something but left a mandatory box empty (like a Customer Name on a bill, or a PIN when adding staff)." },
      { q: "What is the 'Database Repair Tool'?", a: "If you connect to a cloud database (Supabase) and the tables are missing, you click 'Generate Repair SQL'. You copy the code and paste it into your cloud provider to fix the tables." },
      { q: "What does 'Danger Zone: Wipe Database' do?", a: "It permanently deletes absolutely everything: all bills, all inventory, all staff. It resets the software to Day 1." },
      { q: "How do I actually wipe the database?", a: "You must click 'Wipe Database', then manually type the exact words 'DELETE EVERYTHING' in all capital letters, and then confirm." },
      { q: "What if the screen freezes or bugs out?", a: "Simply refresh the webpage. Because data is saved locally, you will not lose anything." }
    ]
  },
  {
    category: "11. Miscellaneous & UI Navigation",
    icon: <Search className="w-5 h-5 text-fuchsia-500" />,
    items: [
      { q: "What happens if I click the 'Padma Suppliers' logo at the top left?", a: "Clicking the logo acts as a 'Home' button. It will instantly return you to the Dashboard from anywhere in the app, saving you clicks." },
      { q: "What happens if my internet connection goes down while I'm billing?", a: "Do not panic! The app is designed to work completely offline. You can continue creating bills, taking advances, and processing returns. The red 'Offline' dot will appear. When internet returns, it will sync." },
      { q: "Can I use the app on my mobile phone?", a: "Yes. The layout is responsive. On small screens, the sidebar becomes a hamburger menu icon at the top left. Tap it to open the navigation menu." },
      { q: "Why do some buttons look faded or disabled?", a: "If a button is grayed out, it means you do not have the required Role access (e.g., Staff trying to edit inventory), or you need to fill out a required field first." },
      { q: "What happens if my computer shuts down suddenly?", a: "Since all data is saved locally in your browser's storage instantly upon clicking 'Save', you will not lose any completed bills. However, a half-typed bill that wasn't saved will be lost." }
    ]
  },
  {
    category: "12. Advanced Functional Scenarios & Test Cases",
    icon: <Activity className="w-5 h-5 text-indigo-400" />,
    items: [
      { q: "Scenario: What happens if I try to rent out more items than I have available?", a: "Test Case Result: The system tracks 'Available Quantity'. If you try to add an item to a bill but the available quantity is 0, it will not allow you to dispatch it until previous customers return their rented items." },
      { q: "Scenario: What happens if I apply a discount that is larger than the bill total?", a: "Test Case Result: The system will calculate the total as negative, but you should not do this. Ensure the discount is less than or equal to the subtotal before clicking Create Bill." },
      { q: "Scenario: Can I partially return items from a single bill (e.g., they rented 10 chairs but only returned 8)?", a: "Test Case Result: Currently, the 'Process Return' button returns the ENTIRE bill at once. If a customer is keeping some items, you must return the whole bill and create a new bill for the remaining items." },
      { q: "Scenario: What happens if I delete an item from Inventory while it is rented out?", a: "Test Case Result: The active bill will still show the item name because it was saved at the time of creation, but when the bill is returned, the system will not be able to restock the deleted item. It is highly recommended to set quantity to 0 instead of deleting." },
      { q: "Scenario: If a customer damages a product, how do I charge them and fix inventory?", a: "Test Case Result: We have built an automated 'Damaged Products' workflow! 1. Click 'Process Selected Returns'. 2. Check the 'Report Damages' checkbox. 3. Enter the number of damaged units and the exact Charge per Unit. 4. The system will automatically multiply them, add the total to the pending balance, and permanently remove the broken items from your master inventory!" },
      { q: "What does the 'Fill All Remaining' button do?", a: "Inside a Bill's details, clicking 'Fill All Remaining' instantly populates the Return Quantity inputs for every active item to their maximum issued amount. This saves time so you don't have to type numbers manually for full returns." },
      { q: "Can I add new items to a bill after it has been created?", a: "Yes. Open the bill, and under 'Items To Dispatch', click the '+ Add New Items to Order' button to append extra inventory to an existing order." },
      { q: "What is the difference between Event Date and Billing Start Date?", a: "'Event Date' is when the actual function occurs. The 'Billing Start Date' (Dispatch Date) is when the items leave your warehouse and the rental charge clock begins." }
    ]
  }
];

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter logic
  const filteredData = FAQ_DATA.map(category => {
    const filteredItems = category.items.filter(
      item => item.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
              item.a.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...category, items: filteredItems };
  }).filter(category => category.items.length > 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header & Search */}
      <div className="space-y-6 text-center pt-8 pb-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">How can we help?</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Search our manual for answers to common questions about managing bills, inventory, and staff.
        </p>
        
        <div className="max-w-xl mx-auto relative mt-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            type="text"
            placeholder="Search the manual (e.g., 'return bill', 'reset pin')..."
            className="pl-11 pr-4 py-6 text-lg rounded-full shadow-sm border-border focus-visible:ring-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* FAQ Categories */}
      <div className="space-y-8 mt-12">
        {filteredData.length === 0 ? (
          <div className="text-center py-12 bg-muted/20 rounded-2xl border border-border border-dashed">
            <p className="text-muted-foreground">No matching answers found in the manual.</p>
            <Button variant="link" onClick={() => setSearchQuery('')}>Clear search</Button>
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full space-y-4">
            {filteredData.map((category, idx) => (
              <AccordionItem 
                key={idx} 
                value={`category-${idx}`} 
                className="bg-card border border-border rounded-xl shadow-sm px-2 overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline px-4 py-5">
                  <div className="flex items-center gap-3">
                    {category.icon}
                    <h2 className="text-xl font-semibold text-foreground">{category.category}</h2>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-0 border-t border-border">
                  <Accordion type="multiple" className="w-full">
                    {category.items.map((item, itemIdx) => (
                      <AccordionItem 
                        key={itemIdx} 
                        value={`item-${idx}-${itemIdx}`}
                        className="px-6 border-b-0 border-t first:border-t-0 border-border"
                      >
                        <AccordionTrigger className="hover:no-underline text-left text-lg font-medium py-4">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground leading-relaxed pb-4 pr-12">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

    </div>
  );
}
