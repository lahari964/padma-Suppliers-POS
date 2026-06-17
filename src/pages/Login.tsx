import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { createClient } from '@supabase/supabase-js';
import { useStore } from '../store/useStore';

const defaultEmployees = [
  { id: '1', name: 'Admin', mobile: '', role: 'Admin', pin: '1234' },
];

export default function Login() {
  const navigate = useNavigate();
  const setCurrentUser = useStore(state => state.setCurrentUser);
  const [employees, setEmployees] = useState(() => {
    const saved = localStorage.getItem('sadma_employees');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length === 3 && parsed[0].name === 'Owner' && parsed[1].name === 'Manager') {
        return defaultEmployees;
      }
      return parsed;
    }
    return defaultEmployees;
  });

  const [loginUserId, setLoginUserId] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const pinInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('sadma_current_user');
    if (saved) {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchCloudEmployees = async () => {
      const { syncDownFromCloud } = await import('../lib/supabase');
      const { success } = await syncDownFromCloud();
      if (success) {
        const updated = localStorage.getItem('sadma_employees');
        if (updated) {
          setEmployees(JSON.parse(updated));
        }
      }
    };
    fetchCloudEmployees();
  }, []);

  const handleLogin = async () => {
    let user = employees.find((e: any) => e.id === loginUserId);

    if (!user) {
      toast.error('Please select an employee');
      return;
    }
    if (user.pin !== loginPin) {
      toast.error('Incorrect PIN');
      return;
    }
    const userSession = { id: user.id, name: user.name, role: user.role || 'Staff', mobile: user.mobile, pin: user.pin };
    setCurrentUser(userSession);
    toast.success(`Welcome back, ${user.name}!`);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm shadow-lg border-border">
        <CardHeader className="text-center space-y-4">
          <img src="https://assets.cdn.filesafe.space/9YKSM9vJJwAmtxbBkIyB/media/6a136179fe2210f89e688b6d.png" alt="Padma Suppliers" className="h-16 mx-auto object-contain" />
          <CardTitle className="text-xl">Staff Login</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Employee</Label>
            <Select value={loginUserId} onValueChange={(val) => {
              setLoginUserId(val);
              setTimeout(() => pinInputRef.current?.focus(), 100);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Choose your name" />
              </SelectTrigger>
              <SelectContent>
                {employees.filter((e: any) => e.status !== 'Inactive').map((emp: any) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </SelectItem>
                ))}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Enter PIN</Label>
            <Input 
              ref={pinInputRef}
              type="password" 
              inputMode="numeric"
              maxLength={4} 
              value={loginPin} 
              onChange={e => setLoginPin(e.target.value)}
              placeholder="****" 
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <Button className="w-full mt-4" onClick={handleLogin}>Login</Button>
        </CardContent>
      </Card>
    </div>
  );
}
