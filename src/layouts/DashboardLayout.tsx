import { useNotifications } from '../hooks/useNotifications';
import { ReactNode, useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarTrigger } from '@/components/ui/sidebar';
import { Home, ListTodo, Package, Settings, LogOut, Sun, Moon, BookOpen, Calendar, CloudUpload, RefreshCw, Clock, CheckCircle2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { syncUpToCloud, syncDownFromCloud } from '../lib/supabase';
import { toast } from '@/components/ui/sonner';
import { useTheme } from 'next-themes';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, employees, isDatabaseConnected, setIsDatabaseConnected, lastSyncTime } = useStore();
  const activeUser = employees.find(e => e.id === currentUser?.id) || currentUser;
  const { resolvedTheme, setTheme } = useTheme();
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      const client = (await import('../lib/supabase')).getSupabaseClient();
      if (!client) {
        setIsDatabaseConnected(false);
        return;
      }
      try {
        const { error } = await client.from('employees').select('id').limit(1);
        setIsDatabaseConnected(!error);
      } catch (err) {
        setIsDatabaseConnected(false);
      }
    };
    checkConnection();
  }, [setIsDatabaseConnected]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const unsubscribe = useStore.subscribe((state, prevState) => {
      // Only trigger sync if actual data changed (ignore UI state changes)
      if (
        state.bills !== prevState.bills ||
        state.inventory !== prevState.inventory ||
        state.employees !== prevState.employees
      ) {
        clearTimeout(timeout);
        timeout = setTimeout(async () => {
          const { success } = await syncUpToCloud();
          if (success) {
            setIsDatabaseConnected(true);
            const now = new Date();
            useStore.setState({ lastSyncTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
          } else {
            setIsDatabaseConnected(false);
          }
        }, 2000); // Wait 2 seconds after the last change before pushing to cloud
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [setIsDatabaseConnected]);

  const handleUpload = async () => {
    toast.loading('Uploading local data to cloud...', { id: 'sync-up' });
    const { success, error } = await syncUpToCloud();
    toast.dismiss('sync-up');
    setIsDatabaseConnected(success);
    if (success) toast.success('Upload complete');
    else toast.error('Upload failed: ' + error);
  };

  const handleDownload = async () => {
    toast.loading('Downloading cloud data...', { id: 'sync-down' });
    const { success, error } = await syncDownFromCloud();
    toast.dismiss('sync-down');
    setIsDatabaseConnected(success);
    if (success) toast.success('Download complete. Local data updated.');
    else toast.error('Download failed: ' + error);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: Home, path: '/' },
    { label: 'Bills', icon: ListTodo, path: '/bills' },
    { label: 'Inventory', icon: Package, path: '/inventory' },
    { label: 'Calendar', icon: Calendar, path: '/calendar' },
    { label: 'Settings', icon: Settings, path: '/settings' },
    { label: 'Help / Manual', icon: BookOpen, path: '/manual' },
  ];

  return (
    <SidebarProvider>
      <div className={`flex min-h-screen w-full transition-colors duration-300 bg-background`}>
        <Sidebar className="border-r border-border">
          <SidebarHeader className="h-16 flex items-center px-4 border-b border-border">
            {/* Logo moved to Top Header */}
          </SidebarHeader>
          <SidebarContent className="py-4">
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.path}
                    tooltip={item.label}
                  >
                    <Link to={item.path}>
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="border-t border-border p-4">
            <div className="flex items-center justify-center py-2 text-xs text-muted-foreground">
              v1.0
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between px-4 gap-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="flex items-center gap-2">
                {!logoError ? (
                  <img 
                    src="/logo.png" 
                    alt="Sadma Suppliers Logo" 
                    className="h-8 w-auto object-contain"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-lg">P</span>
                  </div>
                )}
                <h1 className="font-bold text-xl tracking-tight hidden sm:block">Sadma Suppliers</h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-border">
                {isDatabaseConnected ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Connected</span>
                    <span className="text-[10px] text-muted-foreground ml-2 border-l pl-2 mr-2">Sync: {lastSyncTime}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-500 hover:text-blue-600 hover:bg-blue-50" onClick={handleDownload} title="Download/Refresh from Cloud">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50" onClick={handleUpload} title="Upload Local Data to Cloud">
                      <CloudUpload className="w-3.5 h-3.5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-xs font-medium text-red-600 dark:text-red-400">Offline</span>
                    <Button variant="ghost" size="sm" className="h-5 px-2 ml-1 text-[10px]" onClick={() => navigate('/settings')}>
                      Configure
                    </Button>
                  </>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-3 border-l border-border pl-4 cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="text-right hidden md:block">
                      <p className="text-sm font-semibold leading-none">{activeUser?.name || 'Lahari'}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activeUser?.role || 'Admin'}</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20">
                      {activeUser?.name?.charAt(0).toUpperCase() || 'L'}
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <div className="px-2 pb-2">
                    <p className="text-sm font-medium">{activeUser?.name || 'Lahari'}</p>
                    <p className="text-xs text-muted-foreground">{activeUser?.mobile || 'No Mobile Available'}</p>
                    <Badge variant="secondary" className="mt-1">{activeUser?.role || 'Admin'}</Badge>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive focus:text-destructive-foreground cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
