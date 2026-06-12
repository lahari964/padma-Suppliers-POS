import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-50 relative overflow-hidden selection:bg-primary/30">
      
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="text-center z-10 max-w-2xl px-6">
        <div className="space-y-2 mb-8 relative">
          <div className="absolute inset-0 blur-3xl opacity-20 bg-white/20 rounded-full scale-150 pointer-events-none" />
          <h1 className="relative text-[14rem] font-bold leading-none tracking-tight text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.4)] select-none mix-blend-plus-lighter">
            404
          </h1>
          <h2 className="relative text-3xl md:text-4xl font-medium tracking-widest text-slate-200 mt-[-2rem] uppercase">
            PAGE NOT FOUND
          </h2>
        </div>
        
        <p className="text-lg text-slate-400 mb-12 max-w-lg mx-auto leading-relaxed">
          We're sorry, but the page you are looking for does not exist or has been moved. 
          <br className="hidden sm:block" /> It might have been renamed, removed, or is temporarily unavailable.
        </p>
        
        <Link 
          to="/" 
          className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-medium transition-all rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 hover:border-slate-600 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95"
        >
          <Home className="w-4 h-4" />
          RETURN HOME
        </Link>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-8 text-xs text-slate-600 font-medium tracking-wide text-center w-full">
        © {new Date().getFullYear()} Sadma Suppliers POS • All rights reserved.
      </div>
    </div>
  );
};

export default NotFound;
