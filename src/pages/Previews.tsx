import React from 'react';

const Previews = () => {
  return (
    <div className="min-h-screen bg-muted p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Action Center Widget Options</h1>
          <p className="text-xl text-muted-foreground">Review the UI options below and let me know your choice!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Option 1 */}
          <div className="bg-card rounded-2xl overflow-hidden shadow-lg border border-border">
            <div className="p-6 border-b border-border bg-muted/50">
              <h2 className="text-2xl font-bold">Option A: Clean & Minimalist</h2>
              <p className="text-muted-foreground mt-1">Light mode, subtle colored badges. Matches the existing dashboard perfectly.</p>
            </div>
            <div className="bg-slate-100 flex justify-center p-8 min-h-[400px]">
              <img src="/action1.png" alt="Clean Action Widget" className="max-w-full h-auto rounded-lg shadow-2xl object-cover" />
            </div>
          </div>

          {/* Option 2 */}
          <div className="bg-card rounded-2xl overflow-hidden shadow-lg border border-border">
            <div className="p-6 border-b border-border bg-muted/50">
              <h2 className="text-2xl font-bold">Option B: High-Impact Glassmorphism</h2>
              <p className="text-muted-foreground mt-1">Dark/Vibrant theme. Glowing red gradient alerts to demand immediate attention.</p>
            </div>
            <div className="bg-[#1a0b2e] flex justify-center p-8 min-h-[400px]">
              <img src="/action2.png" alt="Bold Action Widget" className="max-w-full h-auto rounded-lg shadow-2xl object-cover" />
            </div>
          </div>
        </div>
        
        <div className="text-center pb-12">
          <p className="text-lg font-medium">Please reply with your preferred Option (A or B).</p>
        </div>
      </div>
    </div>
  );
};

export default Previews;
