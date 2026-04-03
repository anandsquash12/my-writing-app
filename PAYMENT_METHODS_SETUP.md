# Writers Vault - Payment Methods Setup

## 💳 Supported Payment Methods

Your Writers Vault now supports **multiple payment options** optimized for Indian users:

### 1. **Google Pay** 
- Mobile and web payments
- Fastest checkout experience
- Available on Android and iOS

### 2. **Paytm**
- Largest digital wallet in India
- Direct bank transfer
- Paytm Payment Bank support

### 3. **UPI** (Unified Payments Interface)
- BHIM UPI, Google Pay, PhonePe, Paytm UPI
- Direct bank account transfers

### 4. **Net Banking**
- All major Indian banks supported
- Credit and debit card option

### 5. **Digital Wallets**
- Mobikwik, Freecharge, etc.
- Quick checkout for returning customers

### 6. **Credit/Debit Cards**
- Visa, Mastercard, American Express
- Both domestic and international cards

---

## 🔧 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

No additional packages needed! We use Razorpay's native HTTP API.

### 2. Environment Variables
Add to `.env.local`:
```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_key_id_here
RAZORPAY_KEY_SECRET=your_secret_key_here
```

### 3. Enable Payment Methods in Razorpay Dashboard

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Navigate to **Settings** → **Checkout**
3. Enable these options:
   - ✅ **Google Pay**
   - ✅ **Paytm**
   - ✅ **UPI**
   - ✅ **Net Banking**
   - ✅ **Wallets**

4. Go to **Settings** → **Payment Methods**
5. Activate:
   - ✅ **Cards** (Credit & Debit)
   - ✅ **Recurring Payments** (optional, for subscriptions)

### 4. WhiteList Your Domain (Production)
For production, add your domain to Razorpay:
1. Settings → Security → Whitelisted Domains
2. Add your website domain
3. Save changes

---

## 🧪 Testing Payment Methods

### Test Mode (Development)

Use these test credentials:

#### **Google Pay / UPI**
- Phone: Any number
- Google account: Not required (automatically mocked)
- Amount: Any value (won't be charged)

#### **Paytm**
- Phone: `+919999999999`
- Amount: Any value
- Automatically succeeds in test mode

#### **Net Banking**
Available test accounts for all major banks:
- ICIC, HDFC, AXIS, SBI, etc.
- Use test credentials provided in Razorpay docs

#### **Card (Test)**
- Number: `4111 1111 1111 1111` (Visa)
- Number: `5555 5555 5555 4444` (Mastercard)
- Expiry: Any future date
- CVV: Any 3 digits
- Won't be charged

### Switch to Production

1. Get live keys from Razorpay
2. Replace keys in `.env.local`
3. Enable live mode in Razorpay Console
4. All payment methods will accept real payments

---

## 📊 How Payments Work

```
User clicks "Unlock"
    ↓
Creates Razorpay Order (API: create-order)
    ↓
Opens Razorpay Checkout Modal with all available methods
    ├─ User sees: Google Pay, Paytm, UPI, Net Banking, Cards
    ├─ User selects preferred method
    └─ User completes payment
    ↓
Razorpay returns payment confirmation
    ↓
Verifies payment signature (API: verify-payment)
    ↓
Saves purchase to Firebase
    ↓
Unlocks content for user
```

---

## 🔐 Security

All payment methods are routed through **Razorpay's secure gateway**:

- ✅ PCI DSS compliant (credit card data safe)
- ✅ End-to-end encrypted
- ✅ Fraud detection enabled
- ✅ Signature verification on server-side
- ✅ No direct card storage

---

## 💰 Pricing & Fees

Razorpay charges standard rates for India:

| Payment Method | Razorpay Fee | Savings Bank Fee |
|---|---|---|
| Credit Card | 2.0% + ₹0 | N/A |
| Debit Card | 0.8% + ₹0 | 0.8% + ₹0 |
| Net Banking | 0.8% + ₹0 | 0.8% + ₹0 |
| UPI | 0% | 0% |
| Paytm | 0% | 0% |
| Google Pay | 0% | 0% |

**Best for you**: UPI and Paytm have **zero fees** - encourage users to use these! 🎉

---

## 🚀 Implementation Details

### Payment Method Selection Logic

Razorpay automatically shows:
- **Mobile users**: Google Pay, Paytm, UPI (tap to pay)
- **Desktop users**: Google Pay (if logged in), Paytm, Net Banking, Cards
- **All users**: Can always use cards or net banking

### Checkout Flow (Updated)

The payment button now enables all methods:
```javascript
// In PaymentUnlockButton.tsx
method: {
  googlepay: true,   // Google Pay ✓
  paytm: true,       // Paytm ✓
  upi: true,         // UPI ✓
  netbanking: true,  // Net Banking ✓
  card: true,        // Cards ✓
  wallet: true,      // Digital Wallets ✓
}
```

---

## 🛠️ API Changes

### Before
Used `razorpay` npm package → Had module import issues

### After  
Direct HTTP calls to Razorpay API → No module issues, cleaner setup

**Result**: Faster checkout, fewer dependencies, better performance ⚡

---

## 📈 Monitoring Payments

### In Razorpay Dashboard
1. Go to **Payments** section
2. View all transactions
3. See payment method breakdown:
   - Google Pay: %
   - Paytm: %
   - UPI: %
   - Cards: %
   - etc.

This helps you understand payment method popularity! 📊

---

## ❓ FAQ

### Q: Why multiple payment methods?
**A**: Different users prefer different methods. Paytm + Google Pay capture 70% of Indian digital payments. Offering all methods maximizes conversions.

### Q: Do I need to configure each method separately?
**A**: No! Razorpay does it automatically. Just enable them in dashboard.

### Q: What if a payment fails?
**A**: User can retry with different method. All failures are logged in Razorpay dashboard.

### Q: Can I refund payments?
**A**: Yes, from Razorpay dashboard. Refunds take 3-5 working days depending on payment method.

### Q: How to track which method users prefer?
**A**: Check Razorpay Dashboard → Payments → Filter by method

### Q: Is the markup split possible?
**A**: Yes! Contact Razorpay sales for custom pricing structures.

---

## 🔗 Resources

- [Razorpay Dashboard](https://dashboard.razorpay.com)
- [Razorpay Payment Methods Guide](https://razorpay.com/payment-methods/)
- [Razorpay API Reference](https://razorpay.com/docs/api/orders/)
- [UPI Specifications](https://www.npci.org.in/)
- [Paytm Merchant](https://business.paytm.com/)

---

## 📝 Checklist Before Launch

- [ ] Razorpay account created and verified
- [ ] Live keys generated
- [ ] Payment methods enabled in Razorpay dashboard
- [ ] Domain whitelisted (production)
- [ ] Tested each payment method with test keys
- [ ] Tested with live keys (with small amount ₹1)
- [ ] Verified refund process works
- [ ] Set up Razorpay webhook alerts (optional)
- [ ] Communicated payment methods to users
- [ ] Monitor payment success rate

---

**You're all set! Users can now pay using their preferred method.** 🎉
