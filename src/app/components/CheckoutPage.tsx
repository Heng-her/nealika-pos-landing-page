import {useState} from 'react';
import {ArrowLeft, Check, Lock, Send, X} from 'lucide-react';
import abaLogo from '@/imports/ABA_BANK__1_.png';
import cardsIcon from '@/imports/cards_icons.png';
import visaIcon from '@/imports/Visa_Icn.png';
import mastercardIcon from '@/imports/Master__1_.png';
import unionpayIcon from '@/imports/UnionPay__1_.png';
import jcbIcon from '@/imports/JCB.png';
import logo from '@/imports/logo-nealika.png';

interface Package {
    id: number;
    name: string;
    price: number;
    period: string;
    description: string;
    features: string[];
    highlighted: boolean;
}

interface CheckoutPageProps {
    packages: Package[];
    defaultPackageId: number;
    currentPackageId: number | null;
    onBack: () => void;
    onComplete: () => void;
}

type Duration = '1month' | '3months' | '6months' | '1year';

export default function CheckoutPage({
                                         packages,
                                         defaultPackageId,
                                         currentPackageId,
                                         onBack,
                                         onComplete
                                     }: CheckoutPageProps) {
    const [selectedPackageId, setSelectedPackageId] = useState<number>(defaultPackageId);
    const [paymentMethod, setPaymentMethod] = useState<'khqr' | 'card'>('khqr');
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedDuration, setSelectedDuration] = useState<Duration>('1month');
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false); // Simulating auth state
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
    const [couponError, setCouponError] = useState('');

    const selectedPackage = packages.find(pkg => pkg.id === selectedPackageId)!;
    const packageId = selectedPackage.id;
    const packageName = selectedPackage.name;
    const packagePrice = selectedPackage.price;
    const packageFeatures = selectedPackage.features;

    // Login dialog state
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [isLoginProcessing, setIsLoginProcessing] = useState(false);

    const isUpgrade = currentPackageId && packageId > currentPackageId;
    const isDowngrade = currentPackageId && packageId < currentPackageId;
    const isNewSubscription = !currentPackageId;

    const actionType = isUpgrade ? 'Upgrade' : isDowngrade ? 'Downgrade' : 'Subscribe';

    // Calculate pricing based on duration
    const durationOptions = [
        {
            value: '1month' as Duration,
            label: '1 Month',
            months: 1,
            discount: 0,
            badge: null
        },
        {
            value: '3months' as Duration,
            label: '3 Months',
            months: 3,
            discount: 5,
            badge: 'Save 5%'
        },
        {
            value: '6months' as Duration,
            label: '6 Months',
            months: 6,
            discount: 10,
            badge: 'Save 10%'
        },
        {
            value: '1year' as Duration,
            label: '1 Year',
            months: 12,
            discount: 20,
            badge: 'Save 20%'
        }
    ];

    const selectedOption = durationOptions.find(opt => opt.value === selectedDuration)!;
    const basePrice = packagePrice * selectedOption.months;
    const durationDiscountAmount = basePrice * (selectedOption.discount / 100);
    const subtotalAfterDuration = basePrice - durationDiscountAmount;
    const couponDiscountAmount = appliedCoupon ? subtotalAfterDuration * (appliedCoupon.discount / 100) : 0;
    const subtotal = subtotalAfterDuration - couponDiscountAmount;
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    const handleApplyCoupon = () => {
        setCouponError('');

        // Simple coupon validation (you can expand this)
        const validCoupons: { [key: string]: number } = {
            'SAVE10': 10,
            'SAVE20': 20,
            'WELCOME15': 15,
            'FIRSTTIME': 25
        };

        const upperCoupon = couponCode.toUpperCase();
        if (validCoupons[upperCoupon]) {
            setAppliedCoupon({code: upperCoupon, discount: validCoupons[upperCoupon]});
            setCouponError('');
        } else {
            setCouponError('Invalid coupon code');
            setAppliedCoupon(null);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponError('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Check if user is authenticated
        if (!isAuthenticated) {
            setShowLoginDialog(true);
            return;
        }

        processPayment();
    };

    const processPayment = () => {
        setIsProcessing(true);

        // Simulate payment processing
        setTimeout(() => {
            setIsProcessing(false);
            onComplete();
        }, 2000);
    };

    const handleSendOtp = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoginProcessing(true);

        setTimeout(() => {
            setShowOtpInput(true);
            setIsLoginProcessing(false);
        }, 1000);
    };

    const handleVerifyOtp = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoginProcessing(true);

        setTimeout(() => {
            setIsLoginProcessing(false);
            setIsAuthenticated(true);
            setShowLoginDialog(false);
            // Proceed with payment
            processPayment();
        }, 1000);
    };

    const handleGoogleLogin = () => {
        setIsAuthenticated(true);
        setShowLoginDialog(false);
        processPayment();
    };

    const handleTelegramLogin = () => {
        setIsAuthenticated(true);
        setShowLoginDialog(false);
        processPayment();
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5"/>
                            Back
                        </button>
                        <div className="flex items-center gap-2">
                            <img src={logo} alt="Nealika" className="h-8"/>
                            <span className="text-slate-400">|</span>
                            <span className="text-xl font-semibold text-slate-900">Checkout</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Checkout Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Package Selection */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-xl font-bold text-slate-900 mb-2">Select Package</h2>
                            <p className="text-sm text-slate-600 mb-6">Choose the package that best fits your business
                                needs</p>

                            <div className="grid md:grid-cols-3 gap-4">
                                {packages.map((pkg) => (
                                    <button
                                        key={pkg.id}
                                        type="button"
                                        onClick={() => setSelectedPackageId(pkg.id)}
                                        className={`relative border-2 rounded-xl p-4 transition-all text-left ${
                                            selectedPackageId === pkg.id
                                                ? 'border-blue-600 bg-blue-50'
                                                : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        {pkg.highlighted && (
                                            <span
                                                className="absolute -top-2 -right-2 px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                        Popular
                      </span>
                                        )}
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="font-bold text-slate-900 mb-1">{pkg.name}</h3>
                                                <p className="text-2xl font-bold text-blue-600">
                                                    ${pkg.price}
                                                    <span className="text-sm text-slate-500">/mo</span>
                                                </p>
                                            </div>
                                            <div
                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                                    selectedPackageId === pkg.id
                                                        ? 'border-blue-600 bg-blue-600'
                                                        : 'border-slate-300'
                                                }`}>
                                                {selectedPackageId === pkg.id && (
                                                    <Check className="w-3 h-3 text-white"/>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-600 mb-3">{pkg.description}</p>
                                        <div className="space-y-1">
                                            {pkg.features.slice(0, 3).map((feature, idx) => (
                                                <div key={idx}
                                                     className="flex items-start gap-1 text-xs text-slate-600">
                                                    <Check className="w-3 h-3 text-blue-600 flex-shrink-0 mt-0.5"/>
                                                    <span>{feature}</span>
                                                </div>
                                            ))}
                                            {pkg.features.length > 3 && (
                                                <p className="text-xs text-slate-500 italic mt-1">
                                                    +{pkg.features.length - 3} more
                                                </p>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Subscription Duration */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-xl font-bold text-slate-900 mb-2">Select Subscription Duration</h2>
                            <p className="text-sm text-slate-600 mb-6">Choose how long you want to subscribe. Longer
                                durations offer better savings!</p>

                            <div className="grid md:grid-cols-2 gap-4">
                                {durationOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setSelectedDuration(option.value)}
                                        className={`relative border-2 rounded-xl p-4 transition-all ${
                                            selectedDuration === option.value
                                                ? 'border-blue-600 bg-blue-50'
                                                : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        {option.badge && (
                                            <span
                                                className="absolute -top-2 -right-2 px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                        {option.badge}
                      </span>
                                        )}
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-semibold text-slate-900">{option.label}</span>
                                            <div
                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                    selectedDuration === option.value
                                                        ? 'border-blue-600 bg-blue-600'
                                                        : 'border-slate-300'
                                                }`}>
                                                {selectedDuration === option.value && (
                                                    <Check className="w-3 h-3 text-white"/>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-2xl font-bold text-slate-900">
                                                ${(packagePrice * option.months * (1 - option.discount / 100)).toFixed(2)}
                                            </p>
                                            {option.discount > 0 && (
                                                <p className="text-sm text-slate-500 line-through">
                                                    ${(packagePrice * option.months).toFixed(2)}
                                                </p>
                                            )}
                                            <p className="text-sm text-slate-600 mt-1">
                                                ${packagePrice}/month
                                                × {option.months} month{option.months > 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-xl font-bold text-slate-900 mb-6">Payment Method</h2>

                            {/* Payment Type Selection */}
                            <div className="space-y-3 mb-6">
                                {/* ABA KHQR */}
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('khqr')}
                                    className={`w-full p-4 border-2 rounded-xl transition-all flex items-center justify-between ${
                                        paymentMethod === 'khqr'
                                            ? 'border-blue-600 bg-blue-50'
                                            : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={abaLogo}
                                            alt="ABA KHQR"
                                            className="w-16 h-16 rounded-xl"
                                        />
                                        <div className="text-left">
                                            <p className="font-semibold text-slate-900 text-lg">ABA KHQR</p>
                                            <p className="text-sm text-slate-600">Scan to pay with any banking app</p>
                                        </div>
                                    </div>
                                    <svg
                                        className={`w-6 h-6 transition-colors ${
                                            paymentMethod === 'khqr' ? 'text-blue-600' : 'text-slate-400'
                                        }`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M9 5l7 7-7 7"/>
                                    </svg>
                                </button>

                                {/* Credit/Debit Card */}
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('card')}
                                    className={`w-full p-4 border-2 rounded-xl transition-all flex items-center justify-between ${
                                        paymentMethod === 'card'
                                            ? 'border-blue-600 bg-blue-50'
                                            : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={cardsIcon}
                                            alt="Credit/Debit Card"
                                            className="w-16 h-16 rounded-xl"
                                        />
                                        <div className="text-left">
                                            <p className="font-semibold text-slate-900 text-lg">Credit/Debit Card</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <img src={visaIcon} alt="Visa" className="h-5"/>
                                                <img src={mastercardIcon} alt="Mastercard" className="h-5"/>
                                                <img src={unionpayIcon} alt="UnionPay" className="h-5"/>
                                                <img src={jcbIcon} alt="JCB" className="h-5"/>
                                            </div>
                                        </div>
                                    </div>
                                    <svg
                                        className={`w-6 h-6 transition-colors ${
                                            paymentMethod === 'card' ? 'text-blue-600' : 'text-slate-400'
                                        }`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M9 5l7 7-7 7"/>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={isProcessing}
                            className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isProcessing ? (
                                <>Processing...</>
                            ) : (
                                <>
                                    <Lock className="w-5 h-5"/>
                                    Complete {actionType}
                                </>
                            )}
                        </button>

                        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                            <Lock className="w-4 h-4"/>
                            Secure payment powered by Nealika Co.,LTD.
                        </div>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                            <h2 className="text-xl font-bold text-slate-900 mb-6">Order Summary</h2>

                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-slate-600">Package</span>
                                    <span className="font-semibold text-slate-900">{packageName}</span>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-slate-600">Duration</span>
                                    <span className="font-medium text-slate-900">{selectedOption.label}</span>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-slate-600">Action</span>
                                    <span className={`font-medium ${
                                        isUpgrade ? 'text-blue-600' : isDowngrade ? 'text-orange-600' : 'text-green-600'
                                    }`}>
                    {actionType}
                  </span>
                                </div>
                            </div>

                            {/* Coupon Code Section */}
                            <div className="border-t border-slate-200 pt-4 mb-6">
                                <h3 className="font-semibold text-slate-900 mb-3">Have a Coupon?</h3>
                                {!appliedCoupon ? (
                                    <div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                placeholder="Enter code"
                                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                onClick={handleApplyCoupon}
                                                disabled={!couponCode.trim()}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                        {couponError && (
                                            <p className="text-xs text-red-600 mt-2">{couponError}</p>
                                        )}
                                    </div>
                                ) : (
                                    <div
                                        className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-green-600"/>
                                            <span className="text-sm font-medium text-green-700">
                        {appliedCoupon.code} ({appliedCoupon.discount}% off)
                      </span>
                                        </div>
                                        <button
                                            onClick={handleRemoveCoupon}
                                            className="text-xs text-red-600 hover:text-red-700 font-medium"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-slate-200 pt-4 mb-6">
                                <h3 className="font-semibold text-slate-900 mb-3">Included Features:</h3>
                                <div className="space-y-2">
                                    {packageFeatures.slice(0, 5).map((feature, index) => (
                                        <div key={index} className="flex items-start gap-2 text-sm text-slate-600">
                                            <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5"/>
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                    {packageFeatures.length > 5 && (
                                        <p className="text-sm text-slate-500 italic">
                                            +{packageFeatures.length - 5} more features
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="border-t border-slate-200 pt-4 mb-6">
                                <div className="flex items-center justify-between mb-2 text-slate-600">
                                    <span>Base Price</span>
                                    <span>${basePrice.toFixed(2)}</span>
                                </div>
                                {selectedOption.discount > 0 && (
                                    <div className="flex items-center justify-between mb-2 text-green-600">
                                        <span>Duration Discount ({selectedOption.discount}%)</span>
                                        <span>-${durationDiscountAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                {appliedCoupon && (
                                    <div className="flex items-center justify-between mb-2 text-green-600">
                                        <span>Coupon ({appliedCoupon.code})</span>
                                        <span>-${couponDiscountAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between mb-2 text-slate-600">
                                    <span>Subtotal</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between mb-2 text-slate-600">
                                    <span>Tax (10%)</span>
                                    <span>${tax.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="border-t-2 border-slate-300 pt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-lg font-bold text-slate-900">Total</span>
                                    <span className="text-2xl font-bold text-blue-600">
                    ${total.toFixed(2)}
                  </span>
                                </div>
                                {(selectedOption.discount > 0 || appliedCoupon) && (
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-slate-500">You save</span>
                                        <span className="text-sm font-semibold text-green-600">
                      ${(durationDiscountAmount + couponDiscountAmount).toFixed(2)}
                    </span>
                                    </div>
                                )}
                                <p className="text-xs text-slate-500 mt-2">
                                    One-time payment for {selectedOption.label.toLowerCase()}
                                </p>
                            </div>

                            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                                <p className="text-xs text-slate-600">
                                    By completing this purchase, you agree to our Terms of Service and Privacy Policy.
                                    You can cancel your subscription at any time.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Login Dialog */}
                {showLoginDialog && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-1">Authentication Required</h3>
                                    <p className="text-sm text-slate-600">Please login to complete your purchase</p>
                                </div>
                                <button
                                    onClick={() => setShowLoginDialog(false)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-600"/>
                                </button>
                            </div>

                            {/* Phone Number Login */}
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold text-slate-700 mb-3">Login with Phone Number</h4>
                                {!showOtpInput ? (
                                    <form onSubmit={handleSendOtp}>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Phone Number
                                            </label>
                                            <div className="flex gap-2">
                                                <div
                                                    className="flex items-center px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg">
                                                    <span className="text-slate-700 font-medium">+855</span>
                                                </div>
                                                <input
                                                    type="tel"
                                                    value={phoneNumber}
                                                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                                    placeholder="12 345 678"
                                                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    maxLength={9}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={phoneNumber.length < 8 || isLoginProcessing}
                                            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isLoginProcessing ? (
                                                'Sending...'
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4"/>
                                                    Send OTP
                                                </>
                                            )}
                                        </button>
                                    </form>
                                ) : (
                                    <form onSubmit={handleVerifyOtp}>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Enter OTP Code
                                            </label>
                                            <input
                                                type="text"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                                placeholder="123456"
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest"
                                                maxLength={6}
                                                required
                                            />
                                            <p className="text-sm text-slate-500 mt-2">
                                                Code sent to +855 {phoneNumber}
                                            </p>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={otp.length < 6 || isLoginProcessing}
                                            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed mb-2"
                                        >
                                            {isLoginProcessing ? 'Verifying...' : 'Verify & Continue'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowOtpInput(false);
                                                setOtp('');
                                            }}
                                            className="w-full px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                                        >
                                            Change Phone Number
                                        </button>
                                    </form>
                                )}
                            </div>

                            {/* Divider */}
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-300"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-white text-slate-500">Or continue with</span>
                                </div>
                            </div>

                            {/* Social Login Buttons */}
                            <div className="space-y-3">
                                {/* Google Login */}
                                <button
                                    onClick={handleGoogleLogin}
                                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-3"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path
                                            fill="#4285F4"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        />
                                        <path
                                            fill="#EA4335"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                    Continue with Google
                                </button>

                                {/* Telegram Login */}
                                <button
                                    onClick={handleTelegramLogin}
                                    className="w-full px-4 py-3 bg-[#0088cc] text-white rounded-lg font-medium hover:bg-[#006ba3] transition-colors flex items-center justify-center gap-3"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                        <path
                                            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                                    </svg>
                                    Continue with Telegram
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
