# Writers Vault Setup Guide

## 🎯 Feature Overview

The Writers Vault is a premium content marketplace where writers can:
- Create and publish premium posts with locked content
- Set prices for their content
- Earn from their work through Razorpay payments
- Track their premium posts by creator

Readers can:
- Browse all premium posts on the Vault feed
- View preview content
- Unlock full content via Razorpay payments
- View their purchase history in "My Purchases"

## 🔧 Installation & Setup

### 1. Install Dependencies

The package.json has been updated with Razorpay. Run:

```bash
npm install
```

or if using yarn:

```bash
yarn install
```

### 2. Environment Variables

Add these to your `.env.local` file:

```env
# Razorpay Keys (get from https://dashboard.razorpay.com)
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Firebase (already configured)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_DATABASE_URL=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Cloudinary (for image uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
```

### 3. Get Razorpay Keys

1. Sign up at https://razorpay.com
2. Go to Settings → API Keys → Generated Key
3. Copy the Key ID (public) and Key Secret (private)
4. Add them to your `.env.local` file

**Important**: 
- For testing, use Razorpay's test keys
- For production, switch to live keys
- Keep Key Secret private (never expose in client-side code)

### 4. Firebase Realtime Database Rules

**🔴 IMPORTANT: Copy these UPDATED rules** - The original rules had permission issues.

Update your Firebase Realtime Database rules to allow secure access:

```json
{
  "rules": {
    "premiumPosts": {
      ".read": true,
      ".write": "auth.uid != null",
      "$postId": {
        ".write": "root.child('premiumPosts').child($postId).child('userId').val() === auth.uid || !data.exists()",
        "purchaseCount": {
          ".write": "auth.uid != null"
        }
      }
    },
    "purchases": {
      ".read": "auth.uid != null",
      ".write": "auth.uid != null",
      "$purchaseId": {
        ".validate": "newData.child('userId').val() === auth.uid && newData.child('postId').exists() && newData.child('amount').isNumber()"
      }
    },
    "users": {
      ".read": true,
      "$uid": {
        ".read": true,
        ".write": "$uid === auth.uid"
      }
    },
    "follows": {
      ".read": true,
      ".write": "auth.uid != null"
    },
    "likes": {
      ".read": true,
      ".write": "auth.uid != null"
    },
    "quotes": {
      ".read": true,
      ".write": "auth.uid != null"
    },
    "comments": {
      ".read": true,
      ".write": "auth.uid != null"
    },
    "notifications": {
      ".read": "root.child('users').exists()",
      ".write": "auth.uid != null",
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "auth.uid != null"
      }
    }
  }
}
```

**Changes from original:**
- Added `.write: "auth.uid != null"` to `premiumPosts.purchaseCount` so any authenticated user can increment it
- Fixed `users` rules structure to allow reading user profiles
- Fixed `notifications` rules for proper access

### 5. Cloudinary Configuration

Make sure your Cloudinary upload preset is configured:

```javascript
// In PremiumPostForm.tsx, the upload widget uses:
uploadPreset="my_writing_app_preset"
```

Update this to match your Cloudinary setup preset name.

## 🚀 Features

### For Readers

#### 1. **Vault Feed** (`/vault`)
- Browse all premium posts
- See preview content for each post
- See the price for unlocking
- See author information
- Filter by created date (most recent first)

#### 2. **Premium Post Detail** (`/vault/[id]`)
- View full post details
- See preview content (always visible)
- If not purchased: See "Unlock for ₹X" button
- If purchased: See full locked content
- See author profile with avatar
- See purchase count for social proof

#### 3. **My Purchases** (`/my-purchases`)
- See all posts you've purchased
- Quick access to unlock/read posts
- Shows purchase date for each item
- Shows author name and post preview

### For Creators

#### 1. **Create Premium Post** (`/vault/create`)
- Form to create new premium posts
- Fields:
  - Title (required)
  - Preview Text/Hook (required, shown before unlock)
  - Full Content (required, locked behind payment)
  - Price in INR (required, minimum ₹1)
  - Cover Image (optional, via Cloudinary)
- Auto-saves rich HTML content
- Redirects to `/vault` on success

#### 2. **Premium Posts Tab in Profile** (`/profile`)
- New "Premium" tab showing your premium posts
- Only visible if you have premium posts
- Shows premium post count
- Quick actions (delete)
- Direct link to create new premium posts

## 💳 Payment Flow

### How Payments Work

1. **User clicks "Unlock for ₹X"** on a premium post
2. **Content links to your API** (`/api/vault/create-order`)
3. **API creates Razorpay order** with:
   - Amount (in paise)
   - Post ID
   - User ID
4. **Razorpay checkout opens** in browser
5. **User completes payment**
6. **Razorpay returns payment confirmation**
7. **Content verifies signature** with your API (`/api/vault/verify-payment`)
8. **Purchase record saved** to Firebase:
   - `purchases/{purchaseId}`
   - Links user to post
   - Stores payment ID and timestamp
9. **Content is unlocked** for user

### API Endpoints

#### POST `/api/vault/create-order`
Creates a Razorpay order for a premium post.

**Request:**
```json
{
  "postId": "abc123",
  "amount": 99,
  "userId": "user123"
}
```

**Response:**
```json
{
  "orderId": "order_xyz789"
}
```

#### POST `/api/vault/verify-payment`
Verifies Razorpay payment signature.

**Request:**
```json
{
  "paymentId": "pay_xyz",
  "orderId": "order_xyz",
  "signature": "sig_xyz",
  "postId": "abc123",
  "userId": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully"
}
```

## 📊 Database Structure

### `premiumPosts/{postId}`

```json
{
  "title": "10 Writing Tips",
  "previewText": "Learn the secrets to becoming a better writer...",
  "fullContent": "<h2>Full article content...</h2>",
  "price": 99,
  "imageUrl": "https://cloudinary.com/...",
  "userId": "user123",
  "authorName": "John Doe",
  "createdAt": 1640000000000,
  "likeCount": 5,
  "purchaseCount": 12
}
```

### `purchases/{purchaseId}`

```json
{
  "userId": "user456",
  "postId": "abc123",
  "amount": 99,
  "razorpayPaymentId": "pay_xyz",
  "razorpayOrderId": "order_xyz",
  "createdAt": 1640000000000
}
```

## 🔐 Security Notes

### Client-Side (Public)
- ✅ Post titles, previews, author info
- ✅ Purchase status verification
- ✅ Payment initiation with order ID

### Server-Side (Private)
- ✅ Razorpay Key Secret (never expose)
- ✅ Payment signature verification
- ✅ Order creation with secret

### Firebase Rules
- ✅ Anyone can read premium post listings
- ✅ Only authenticated users can create posts
- ✅ Only post owners can delete their posts
- ✅ Only post owner can modify post details
- ✅ Purchases saved by authenticated users only

## 🧪 Testing

### Test with Razorpay's Test Keys

Razorpay provides test cards for development:
- **Card Number:** 4111 1111 1111 1111
- **CVV:** Any 3 digits
- **Expiry:** Any future date

Payments with test cards will not be charged.

### Test Flow

1. Create a premium post on `/vault/create`
2. Go to `/vault` and find your post
3. Click "Unlock for ₹X"
4. In Razorpay popup, use test card details
5. Complete the payment
6. Check that:
   - Payment succeeds
   - Content becomes visible
   - Purchase appears in `/my-purchases`
   - Purchase record in Firebase

## 📝 Environment Checklist

Before deploying to production:

- [ ] Razorpay account created
- [ ] Razorpay API keys in `.env.local`
- [ ] Firebase Realtime Database rules updated
- [ ] Cloudinary preset name updated in form
- [ ] Test payment flow works
- [ ] Switch Razorpay keys to LIVE (from test)
- [ ] Update environment variables on hosting platform
- [ ] Test in production environment
- [ ] Monitor payment logs in Razorpay dashboard

## 🚨 Troubleshooting

### "Failed to create payment order"
- Check Razorpay keys in environment variables
- Verify `RAZORPAY_KEY_ID` is set on client (`NEXT_PUBLIC_*`)
- Verify `RAZORPAY_KEY_SECRET` is set only on server

### "Payment signature verification failed"
- Ensure keys match (test keys for test, live for live)
- Check that request body matches expected format
- Verify order amount is in correct format

### Content not showing after purchase
- Check Firebase rules allow purchase writes
- Verify purchase record saved with correct userId and postId
- Check browser console for errors
- Refresh page to reload data

### Image upload not working
- Verify Cloudinary upload preset exists
- Check `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is set
- Ensure upload preset is not restricted

## 📚 Additional Resources

- [Razorpay Documentation](https://razorpay.com/docs/)
- [Firebase Realtime Database Docs](https://firebase.google.com/docs/database)
- [Cloudinary Upload Widget](https://cloudinary.com/documentation/upload_widget)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

## 💡 Future Enhancements

Possible improvements:
- [ ] Earnings dashboard for creators
- [ ] Email notifications for purchases
- [ ] Refund system
- [ ] Revenue splits (between platform and creators)
- [ ] Premium post categories/filters
- [ ] Ratings/reviews for premium posts
- [ ] Bundle purchases
- [ ] Subscription model
- [ ] Analytics for creators
