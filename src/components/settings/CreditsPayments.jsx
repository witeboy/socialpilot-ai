import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, CreditCard, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { format } from 'date-fns';

const creditPackages = [
  { credits: 50, price: 9.99 },
  { credits: 150, price: 24.99, popular: true },
  { credits: 500, price: 79.99 }
];

export default function CreditsPayments({ userPersona }) {
  const [selectedPkg, setSelectedPkg] = useState(null);

  const { data: transactions = [] } = useQuery({
    queryKey: ['creditTransactions'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.CreditTransaction.filter({ created_by: user.email }, '-created_date', 10);
    }
  });

  const handlePurchase = (pkg) => {
    const isAfrican = ['Nigeria', 'South Africa', 'Kenya', 'Ghana', 'Egypt', 'Morocco', 'Ethiopia', 'Tanzania'].includes(userPersona?.country);
    const gateway = isAfrican ? 'Flutterwave' : 'Stripe';
    alert(`${gateway} Payment Integration Coming Soon!\n\n${pkg.credits} credits for $${pkg.price}`);
  };
  
  const totalCredits = (userPersona?.purchased_credits || 0) + (userPersona?.daily_ad_credits || 0);
  const isAfrican = ['Nigeria', 'South Africa', 'Kenya', 'Ghana', 'Egypt', 'Morocco', 'Ethiopia', 'Tanzania'].includes(userPersona?.country);

  return (
    <div className="space-y-4">
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-md p-5 sm:p-7">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-[#DDF7F8] dark:bg-[#0FB5BA]/20 rounded-lg">
            <Coins className="w-6 h-6 text-[#0FB5BA]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Credit Balance</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Your available credits</p>
          </div>
        </div>

        <div className="text-center py-6">
          <p className="text-5xl font-bold text-slate-900 dark:text-white mb-4">{totalCredits}</p>
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1 font-semibold">Purchased</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{userPersona?.purchased_credits || 0}</p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Never expire</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1 font-semibold">Daily Ad Credits</p>
              <p className="text-xl font-bold text-amber-500 dark:text-amber-400">{userPersona?.daily_ad_credits || 0}</p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Expire at midnight</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-md p-5 sm:p-7">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Buy Credits</h3>
        
        <div className="grid gap-3">
          {creditPackages.map((pkg, idx) => (
            <div
              key={idx}
              className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedPkg === idx ? 'border-[#0FB5BA] bg-[#DDF7F8] dark:bg-[#0FB5BA]/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
              onClick={() => setSelectedPkg(idx)}
            >
...
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{pkg.credits} Credits</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">${pkg.price}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedPkg !== null && (
          <Button
            onClick={() => handlePurchase(creditPackages[selectedPkg])}
            className="w-full mt-4 h-12 px-4 rounded-lg text-white font-semibold bg-gradient-to-r from-[#0FB5BA] to-[#14D4BA] shadow-md hover:scale-105 transition-transform"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Pay with {isAfrican ? 'Flutterwave' : 'Stripe'}
          </Button>
        )}
      </Card>

      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-md p-5 sm:p-7">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Transactions</h3>
        
        {transactions.length === 0 ? (
          <p className="text-center text-slate-600 dark:text-slate-400 py-4">No transactions yet</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  {tx.amount > 0 ? <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" /> : <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />}
                  <div>
                    <p className="text-sm text-slate-900 dark:text-white font-medium">{tx.description}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">{format(new Date(tx.created_date), 'MMM d, h:mm a')}</p>
                  </div>
                </div>
                <p className={`font-bold ${tx.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}