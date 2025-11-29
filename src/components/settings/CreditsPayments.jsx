import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';

const creditPackages = [
  { credits: 50, price: 9.99, popular: false },
  { credits: 150, price: 24.99, popular: true },
  { credits: 500, price: 79.99, popular: false }
];

export default function CreditsPayments({ userPersona }) {
  const [selectedPackage, setSelectedPackage] = useState(null);

  const { data: transactions = [] } = useQuery({
    queryKey: ['creditTransactions'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.CreditTransaction.filter(
        { created_by: user.email },
        '-created_date',
        10
      );
    }
  });

  const handlePurchase = (pkg) => {
    // In production, this would integrate with Stripe/Flutterwave
    alert(`Payment integration coming soon!\n\n${pkg.credits} credits for $${pkg.price}\n\nPayment gateway: ${userPersona?.country?.includes('Africa') ? 'Flutterwave' : 'Stripe'}`);
  };

  return (
    <div className="space-y-4">
      {/* Current Balance */}
      <Card className="bg-gradient-to-br from-purple-900/40 to-cyan-900/40 backdrop-blur-sm border border-purple-500/30 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm mb-2">Available Credits</p>
            <div className="flex items-center gap-3">
              <Coins className="w-8 h-8 text-yellow-400" />
              <span className="text-5xl font-bold text-white">{userPersona?.credits_balance || 0}</span>
            </div>
          </div>
          <div className="text-right">
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50">
              {userPersona?.subscription_status || 'Free'}
            </Badge>
            <p className="text-xs text-slate-400 mt-2">
              Gateway: {userPersona?.country?.includes('Africa') ? 'Flutterwave' : 'Stripe'}
            </p>
          </div>
        </div>
      </Card>

      {/* Credit Packages */}
      <Card className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Buy Credits</h3>
        
        <div className="grid gap-3">
          {creditPackages.map((pkg, idx) => (
            <div
              key={idx}
              className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedPackage === idx
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
              }`}
              onClick={() => setSelectedPackage(idx)}
            >
              {pkg.popular && (
                <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-600 to-cyan-600">
                  Most Popular
                </Badge>
              )}
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{pkg.credits} Credits</p>
                  <p className="text-sm text-slate-400">${pkg.price}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Per credit</p>
                  <p className="text-sm font-medium text-cyan-400">
                    ${(pkg.price / pkg.credits).toFixed(3)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedPackage !== null && (
          <Button
            onClick={() => handlePurchase(creditPackages[selectedPackage])}
            className="w-full mt-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Purchase {creditPackages[selectedPackage].credits} Credits
          </Button>
        )}
      </Card>

      {/* Transaction History */}
      <Card className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Recent Transactions</h3>
        
        {transactions.length === 0 ? (
          <p className="text-center text-slate-400 py-4">No transactions yet</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {tx.amount > 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  )}
                  <div>
                    <p className="text-sm text-white font-medium">{tx.description}</p>
                    <p className="text-xs text-slate-500">
                      {format(new Date(tx.created_date), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </p>
                  <p className="text-xs text-slate-500">Balance: {tx.balance_after}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}