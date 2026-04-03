# Cloudinary Integration Setup

## 1. Environment Variables

Add to `.env.local`:

```
CLOUDINARY_CLOUD_NAME= dzpjud6su
CLOUDINARY_API_KEY= 454192936329231
CLOUDINARY_API_SECRET= X0PBrr_cndQFQcMyjSfO4PF5MeA
```

Get these from: https://cloudinary.com/console/settings/api-keys

## 2. Files Created

- `/src/app/api/upload/route.ts` - Cloudinary upload API endpoint
- `/src/lib/uploadImage.ts` - Reusable upload function
- `/src/lib/avatarUpload.ts` - Avatar-specific handler (saves to Firebase)
- `/src/lib/postImageUpload.ts` - Post image handler
- `/src/app/components/AvatarUpload.tsx` - Avatar upload component
- `/src/app/components/PostImageUpload.tsx` - Post image upload component

## 3. Integration Examples

### Avatar Upload (in profile/edit/page.tsx)

```tsx
import AvatarUpload from "@/app/components/AvatarUpload";

// Inside your component:
<AvatarUpload 
  userId={user.uid} 
  currentAvatar={profile.avatarURL}
  onSuccess={(url) => console.log("Avatar updated:", url)}
/>
```

### Post Image Upload (in create/page.tsx)

```tsx
import PostImageUpload from "@/app/components/PostImageUpload";

// Add state:
const [postImage, setPostImage] = useState<string>("");

// Inside form:
<PostImageUpload 
  onImageSelect={setPostImage}
  selectedImage={postImage}
/>

// Save post with image:
await set(ref(db, `posts/${postId}`), {
  text: content,
  image: postImage,  // Add this
  userId: user.uid,
  createdAt: Date.now(),
  // ... other fields
});
```

## 4. Features Included

✓ File type validation (JPEG, PNG, WebP, GIF only)
✓ File size limit (5MB max)
✓ Loading states
✓ Error handling (400 & 500 responses)
✓ Cloudinary folder organization
✓ Firebase integration for avatar persistence
✓ TypeScript throughout
✓ Production-ready error messages
