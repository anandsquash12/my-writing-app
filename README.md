# My Writing App

## Run locally

```bash
npm install
npm run dev
```

Open: `http://localhost:3000`

## Pages to test

- `/`
- `/login`
- `/create`
- `/search`

## Quick auth test flow

1. Go to `/login`.
2. Use email + password with either `Sign Up` or `Login`, or click `Continue with Google`.
3. Confirm redirect to `/`.
4. Open `/create`:
   - Logged out users should be redirected to `/login`.
   - Logged in users should see "Posting as: ..." and can add a post without entering author manually.
5. Use the navbar:
   - Logged out: `Login`
   - Logged in: email + `Logout`
