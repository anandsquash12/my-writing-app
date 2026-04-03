# Writers Vault - Quick Start Guide

## ⚡ TL;DR Setup (5 minutes)

### 1. Install
```bash
npm install
```

### 2. ⚠️ Update Firebase Rules (CRITICAL - Do This First!)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project → Realtime Database → Rules tab
3. **Replace all rules** with the updated rules from: `WRITERS_VAULT_SETUP.md` section 4
4. Click **Publish**

⚠️ **If you skip this step, you'll get PERMISSION_DENIED errors!**

### 3. Add Environment Variables
Edit `.env.local`:
```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_key_from_razorpay
RAZORPAY_KEY_SECRET=your_secret_from_razorpay
```

Get keys from: https://dashboard.razorpay.com/app/keys

### 4. Test It
1. Go to `/vault/create` → Create a premium post
2. Go to `/vault` → See your post
3. Click "Unlock" → Use test card `4111 1111 1111 1111`
4. Check `/my-purchases` → See purchased post

## 📍 New URLs

| URL | Purpose |
|-----|---------|
| `/vault` | Browse all premium posts |
| `/vault/create` | Create new premium post |
| `/vault/[id]` | View premium post details |
| `/my-purchases` | View your purchased posts |
| `/profile` (tab) | See your premium posts |

## 📚 Documentation Files

- **`WRITERS_VAULT_SETUP.md`** - Complete setup and config guide
- **`WRITERS_VAULT_IMPLEMENTATION.md`** - What was built and why

## 🔑 Get Razorpay Keys

1. Sign up: https://razorpay.com
2. Dashboard → Settings → API Keys
3. Copy Key ID (public) and Key Secret (private)
4. Add to `.env.local`

**For testing:** Use test keys + test card `4111 1111 1111 1111`

## 🎯 What Works

✅ Create premium posts with title, preview, full content, price, image  
✅ Browse and preview all premium posts  
✅ Unlock content via Razorpay payment  
✅ View purchased posts history  
✅ See premium posts in your profile  
✅ Delete your own premium posts  
✅ Track purchase count on posts  

## 🚀 Production Checklist

- [ ] npm install (dependencies installed)
- [ ] Razorpay account created
- [ ] Keys added to `.env.local`
- [ ] Firebase rules updated
- [ ] Test payment works (use test keys)
- [ ] Switch to LIVE Razorpay keys
- [ ] Deploy to production
- [ ] Monitor payment logs

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Payment failed" | Check Razorpay keys in `.env.local` |
| "Content won't unlock" | Verify Firebase rules allow purchase writes |
| "Image won't upload" | Check `/api/upload` endpoint exists |
| "Errors in browser" | Check `.env.local` has all required vars |

## 📞 Key Resources

- Razorpay Docs: https://razorpay.com/docs/
- Firebase Docs: https://firebase.google.com/docs/database
- Next.js Docs: https://nextjs.org/docs

## 💡 Pro Tips

1. **Test Mode:** Keep test keys during development
2. **Test Card:** `4111 1111 1111 1111` with any future expiry date
3. **Monitor:** Check Razorpay dashboard for all payments
4. **Backup:** Regularly backup your Firebase data
5. **Pricing:** Start small (₹10-99) to test before bigger amounts

---

**Everything is ready to go!** Just add your Razorpay keys and you're live. 🎉
