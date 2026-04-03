# Firebase Rules Update - Visual Step-by-Step Guide

## 🎯 Goal
Update your Firebase Realtime Database rules to fix the `PERMISSION_DENIED` error.

## 📍 Where to Get the Updated Rules

Open this file in your editor:
```
📁 my-writing-app/
   └─ 📄 WRITERS_VAULT_SETUP.md
```

Scroll down to section **"4. Firebase Realtime Database Rules"**

You'll see a code block that starts with:
```json
{
  "rules": {
    "premiumPosts": {
      ".read": true,
      ".write": "auth.uid != null",
      ...
```

Copy the ENTIRE JSON block (from `{` to the final `}`).

## 🚀 Steps to Apply

### **Step 1: Open Firebase Console**
- Go to: https://console.firebase.google.com
- Select your project from the list
- Click on **"Realtime Database"** in the left sidebar

### **Step 2: Click "Rules" Tab**
You should see:
```
[ Data ]  [ Rules ] ← Click here
```

### **Step 3: Delete Old Rules**
You should see the old rules:
```json
{
  "rules": {
    "premiumPosts": {
      ".read": true,
      ".write": "auth.uid != null",
      "$postId": {
        ".write": "root.child('premiumPosts')..."
```

**Select all** (Ctrl+A on Windows, Cmd+A on Mac) and **delete** them.

### **Step 4: Paste New Rules**
- Open `WRITERS_VAULT_SETUP.md` section 4
- Copy the complete JSON block (it's long - make sure you copy ALL of it!)
- Paste into Firebase Rules editor

You should see:
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
      ...
```

### **Step 5: Check for Errors**
Look for any red error messages or warnings in the editor.

✅ If you see: `"Syntax OK"` in green → All good!
❌ If you see: Red errors → Check that you copied all the JSON correctly

### **Step 6: Publish**
Click the blue **"Publish"** button in the bottom right.

Wait a moment - you should see a success message:
```
✓ Rules Published
```

### **Step 7: Done!**
Return to your app and test:
1. Go to `/vault/create` → Create a premium post
2. Go to `/vault` → Unlock the post
3. Complete test payment
4. ✅ Should work without errors!

## 📋 Checklist

Use this to make sure you've done everything:

- [ ] Opened Firebase Console
- [ ] Went to Realtime Database → Rules tab
- [ ] Deleted the old rules
- [ ] Copied the entire JSON from WRITERS_VAULT_SETUP.md section 4
- [ ] Pasted into Firebase Rules editor
- [ ] Verified "Syntax OK" appears (or no red errors)
- [ ] Clicked "Publish" button
- [ ] Waited for "Rules Published" confirmation
- [ ] Hard refreshed browser (Ctrl+Shift+R)
- [ ] Tested the feature

## ⚠️ Common Mistakes to Avoid

| Mistake | Fix |
|---------|-----|
| Only copied part of the JSON | Make sure to copy from `{` to the final `}` - it's a large block |
| Didn't click Publish | The rules won't take effect until you click the blue Publish button |
| Pasted while old rules were still there | Delete the old rules FIRST, then paste new ones |
| Didn't hard refresh browser | Press Ctrl+Shift+R to clear the browser cache |
| Copied from old setup file | Make sure you're copying from the UPDATED WRITERS_VAULT_SETUP.md |

## 🔍 How to Know It Worked

After 2-3 minutes, try testing:

1. Visit `/vault` in your app
2. Try to create a premium post (go to `/vault/create`)
3. Try to unlock a post
4. If it works without errors → ✅ Your rules are updated!
5. If you still see `PERMISSION_DENIED` → Check you published the rules

## 📸 What It Should Look Like

### Before (in Firebase Console):
```
[ Old rules with many lines ]
❌ PERMISSION_DENIED errors in app
```

### After (in Firebase Console):
```
{
  "rules": {
    "premiumPosts": {
      ".read": true,
      ".write": "auth.uid != null",
      "$postId": {
        ".write": "root.child('premiumPosts').child($postId).child('userId').val() === auth.uid || !data.exists()",
        "purchaseCount": {
          ".write": "auth.uid != null"  ← THIS IS THE KEY FIX
        }
      }
    },
    ...more rules...
  }
}

✓ Rules Published (green checkmark)
✅ App works without errors!
```

## 💡 What Changed

The key change is this new section:
```json
"purchaseCount": {
  ".write": "auth.uid != null"
}
```

This allows ANY authenticated user to update the `purchaseCount` field, which tracks how many people have purchased a premium post. Without this, unlocking failed.

---

**Once you're done, return to your app and test! 🎉**
