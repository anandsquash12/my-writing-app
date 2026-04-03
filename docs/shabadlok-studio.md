# ShabadLok Studio

## Required packages

- `firebase`
- `next`
- `react`
- `react-dom`
- `tailwindcss`
- `postcss`
- `autoprefixer`

## Folder structure

```txt
src/app/studio/page.tsx
src/app/quotes/page.tsx
src/app/quotes/QuotesFeedClient.tsx
src/app/quotes/[id]/page.tsx
src/app/quotes/[id]/QuoteDetailsClient.tsx
src/app/components/quotes/QuoteStudioEditor.tsx
src/app/components/quotes/QuoteCard.tsx
src/app/components/quotes/QuoteLikeButton.tsx
src/app/lib/quotes.ts
```

## Realtime Database structure

```json
{
  "quotes": {
    "{quoteId}": {
      "imageURL": "https://...",
      "textContent": [
        {
          "id": "layer-1",
          "text": "string",
          "x": 420,
          "y": 520,
          "fontFamily": "Georgia, serif",
          "fontSize": 42,
          "color": "#ffffff",
          "align": "center",
          "bold": true,
          "shadow": true,
          "width": 620
        }
      ],
      "authorId": "uid",
      "authorName": "Writer Name",
      "isAnonymous": false,
      "createdAt": 1700000000000,
      "updatedAt": 1700000000000,
      "likeCount": 0,
      "visibility": "public"
    }
  },
  "quoteLikes": {
    "{quoteId}": {
      "{uid}": true
    }
  },
  "quoteReports": {
    "{quoteId}": {
      "{reportId}": {
        "fromUid": "uid",
        "reason": "inappropriate",
        "createdAt": 1700000000000
      }
    }
  }
}
```

## Storage paths

- `quotes/{uid}/{quoteId}.png`
- `users/{uid}/avatar.jpg`
