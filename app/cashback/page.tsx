'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function CashbackPage() {
    const [selectedTab, setSelectedTab] = useState<'overview' | 'claim'>('overview');
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const cashbackBalance = 145.50;
    const totalEarned = 892.30;
    const bookingsCount = 12;

    return (
        <div className="min-h-screen px-4 py-12 md:py-20">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-light mb-4">Cashback Program</h1>
                    <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
                        Earn rewards on every booking and use them for future travel discounts
                    </p>
                </div>

                {/* Balance Card */}
                <div className="bg-gradient-to-br from-accent/10 via-accent/5 to-transparent border border-accent/20 rounded-2xl p-8 md:p-12 mb-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="relative z-10">
                        <div className="grid md:grid-cols-3 gap-8">
                            <div>
                                <p className="text-sm text-foreground/60 mb-2">Available Balance</p>
                                <p className="text-4xl md:text-5xl font-light text-accent">${cashbackBalance.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-foreground/60 mb-2">Total Earned</p>
                                <p className="text-3xl md:text-4xl font-light">${totalEarned.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-foreground/60 mb-2">Bookings Made</p>
                                <p className="text-3xl md:text-4xl font-light">{bookingsCount}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-4 mb-8 border-b border-foreground/10">
                    <button
                        onClick={() => setSelectedTab('overview')}
                        className={`pb-4 px-2 font-medium transition-colors relative ${
                            selectedTab === 'overview'
                                ? 'text-accent'
                                : 'text-foreground/60 hover:text-foreground'
                        }`}
                    >
                        How It Works
                        {selectedTab === 'overview' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                        )}
                    </button>
                    <button
                        onClick={() => setSelectedTab('claim')}
                        className={`pb-4 px-2 font-medium transition-colors relative ${
                            selectedTab === 'claim'
                                ? 'text-accent'
                                : 'text-foreground/60 hover:text-foreground'
                        }`}
                    >
                        Claim Cashback
                        {selectedTab === 'claim' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                        )}
                    </button>
                </div>

                {/* Overview Tab */}
                {selectedTab === 'overview' && (
                    <div className="space-y-12">
                        {/* How Cashback Accumulates */}
                        <section>
                            <h2 className="text-2xl font-light mb-6">How Cashback Accumulates</h2>
                            <div className="bg-foreground/5 border border-foreground/10 rounded-xl p-6 md:p-8">
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                                            <span className="text-accent font-semibold">1%</span>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-2">Earn on Every Booking</h3>
                                            <p className="text-foreground/70">
                                                Receive 1% cashback on the total value of every booking you make through our platform. 
                                                The cashback is automatically credited to your account after the booking is confirmed.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-2">Example Calculation</h3>
                                            <p className="text-foreground/70">
                                                Book a tour worth $5,000 → Earn $50 cashback<br />
                                                Book a package worth $10,000 → Earn $100 cashback
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Terms of Use */}
                        <section>
                            <h2 className="text-2xl font-light mb-6">Terms of Use</h2>
                            <div className="bg-foreground/5 border border-foreground/10 rounded-xl p-6 md:p-8">
                                <ul className="space-y-4">
                                    <li className="flex gap-3">
                                        <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-foreground/80">
                                            <strong className="text-foreground">No Cash Withdrawals:</strong> Cashback cannot be transferred to a bank account or withdrawn as cash
                                        </span>
                                    </li>
                                    <li className="flex gap-3">
                                        <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-foreground/80">
                                            <strong className="text-foreground">Discount on Future Bookings:</strong> Cashback can only be used as a discount on future tour bookings
                                        </span>
                                    </li>
                                    <li className="flex gap-3">
                                        <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-foreground/80">
                                            <strong className="text-foreground">Code Generation:</strong> To use your cashback, generate a unique discount code and provide it to our manager when making your next booking
                                        </span>
                                    </li>
                                    <li className="flex gap-3">
                                        <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-foreground/80">
                                            <strong className="text-foreground">One-Time Use:</strong> Each generated code can only be used once and expires after 30 days
                                        </span>
                                    </li>
                                    <li className="flex gap-3">
                                        <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-foreground/80">
                                            <strong className="text-foreground">Minimum Redemption:</strong> A minimum cashback balance of $10 is required to generate a discount code
                                        </span>
                                    </li>
                                    <li className="flex gap-3">
                                        <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-foreground/80">
                                            <strong className="text-foreground">Non-Transferable:</strong> Cashback and discount codes are tied to your account and cannot be transferred to others
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </section>

                        {/* FAQ */}
                        <section>
                            <h2 className="text-2xl font-light mb-6">Frequently Asked Questions</h2>
                            <div className="space-y-4">
                                <details className="bg-foreground/5 border border-foreground/10 rounded-xl p-6 group">
                                    <summary className="cursor-pointer font-semibold list-none flex justify-between items-center">
                                        <span>When is cashback credited to my account?</span>
                                        <svg className="w-5 h-5 transform group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </summary>
                                    <p className="mt-4 text-foreground/70">
                                        Cashback is automatically credited to your account within 24 hours after your booking is confirmed. You'll receive an email notification once it's added.
                                    </p>
                                </details>
                                <details className="bg-foreground/5 border border-foreground/10 rounded-xl p-6 group">
                                    <summary className="cursor-pointer font-semibold list-none flex justify-between items-center">
                                        <span>Can I use multiple discount codes on one booking?</span>
                                        <svg className="w-5 h-5 transform group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </summary>
                                    <p className="mt-4 text-foreground/70">
                                        No, only one cashback discount code can be applied per booking. However, you can generate a code for your entire available balance.
                                    </p>
                                </details>
                                <details className="bg-foreground/5 border border-foreground/10 rounded-xl p-6 group">
                                    <summary className="cursor-pointer font-semibold list-none flex justify-between items-center">
                                        <span>What happens if I cancel a booking?</span>
                                        <svg className="w-5 h-5 transform group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </summary>
                                    <p className="mt-4 text-foreground/70">
                                        If you cancel a booking, the cashback earned from that booking will be deducted from your balance. If you used a discount code on the booking, the code value will be restored to your account.
                                    </p>
                                </details>
                            </div>
                        </section>
                    </div>
                )}

                {/* Claim Tab */}
                {selectedTab === 'claim' && (
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-foreground/5 border border-foreground/10 rounded-xl p-8 md:p-10">
                            <h2 className="text-2xl font-light mb-6">Claim Your Cashback</h2>
                            
                            {/* Step-by-step guide */}
                            <div className="space-y-6 mb-8">
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 border border-accent flex items-center justify-center text-sm font-semibold">
                                        1
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">Enter Amount</h3>
                                        <p className="text-sm text-foreground/70">
                                            Specify how much cashback you want to use (minimum $10, maximum: your available balance)
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 border border-accent flex items-center justify-center text-sm font-semibold">
                                        2
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">Generate Code</h3>
                                        <p className="text-sm text-foreground/70">
                                            Click the button to generate a unique discount code
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 border border-accent flex items-center justify-center text-sm font-semibold">
                                        3
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">Contact Manager</h3>
                                        <p className="text-sm text-foreground/70">
                                            Provide the generated code to our booking manager when making your next reservation
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 border border-accent flex items-center justify-center text-sm font-semibold">
                                        4
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">Enjoy Your Discount</h3>
                                        <p className="text-sm text-foreground/70">
                                            The manager will apply the discount to your booking total
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Claim Form */}
                            <div className="border-t border-foreground/10 pt-8">
                                <div className="mb-6">
                                    <label className="block text-sm font-medium mb-3">
                                        Amount to Claim
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/60">
                                            $
                                        </span>
                                        <input
                                            type="number"
                                            min="10"
                                            max={cashbackBalance}
                                            step="0.01"
                                            placeholder="0.00"
                                            className="w-full h-12 bg-background border border-foreground/20 rounded-lg pl-8 pr-4 focus:outline-none focus:border-accent transition-colors"
                                        />
                                    </div>
                                    <p className="text-xs text-foreground/60 mt-2">
                                        Available balance: ${cashbackBalance.toFixed(2)}
                                    </p>
                                </div>

                                <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 mb-6">
                                    <div className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <p className="text-sm text-foreground/80">
                                            Once generated, the code will be valid for 30 days and can only be used once. The claimed amount will be deducted from your balance immediately.
                                        </p>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={agreedToTerms}
                                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                                            className="mt-1 w-4 h-4 rounded border-foreground/20 bg-background text-accent focus:ring-2 focus:ring-accent/20"
                                        />
                                        <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">
                                            I agree to the terms and understand that this cashback will be used as a discount on my next booking and cannot be withdrawn as cash
                                        </span>
                                    </label>
                                </div>

                                <Button
                                    disabled={!agreedToTerms}
                                    className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Generate Discount Code
                                </Button>

                                {/* Code Display Area (shown after generation) */}
                                <div className="mt-8 p-6 bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/30 rounded-lg hidden">
                                    <p className="text-sm text-foreground/70 mb-3 text-center">
                                        Your Discount Code
                                    </p>
                                    <div className="bg-background border border-accent/20 rounded-lg p-4 mb-4">
                                        <p className="text-2xl font-mono text-center tracking-wider text-accent">
                                            CASHBACK-XXXX-YYYY
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            className="flex-1 border-accent/30 hover:bg-accent/10"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            Copy Code
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex-1 border-accent/30 hover:bg-accent/10"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            Download
                                        </Button>
                                    </div>
                                    <p className="text-xs text-foreground/60 text-center mt-4">
                                        Code expires in 30 days • Provide this to your booking manager
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Recent Claims History */}
                        <div className="mt-8 bg-foreground/5 border border-foreground/10 rounded-xl p-8">
                            <h3 className="text-lg font-semibold mb-4">Recent Claims</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-3 border-b border-foreground/10">
                                    <div>
                                        <p className="font-medium">CASHBACK-A1B2-C3D4</p>
                                        <p className="text-xs text-foreground/60">Generated on Oct 15, 2025</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">$50.00</p>
                                        <p className="text-xs text-green-500">Active</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-foreground/10">
                                    <div>
                                        <p className="font-medium">CASHBACK-E5F6-G7H8</p>
                                        <p className="text-xs text-foreground/60">Generated on Sep 28, 2025</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">$75.00</p>
                                        <p className="text-xs text-foreground/60">Used</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center py-3">
                                    <div>
                                        <p className="font-medium">CASHBACK-I9J0-K1L2</p>
                                        <p className="text-xs text-foreground/60">Generated on Aug 12, 2025</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">$100.00</p>
                                        <p className="text-xs text-foreground/60">Used</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}