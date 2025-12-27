# Deploying Battery Management System to Render

## Step 1: Create GitHub Repository

1. **Initialize Git** (if not already done):
```bash
cd c:\Users\MSII\Desktop\dotnet-battery
git init
git add .
git commit -m "Initial commit - Battery Management System"
```

2. **Create GitHub Repository**:
   - Go to [GitHub](https://github.com/new)
   - Create a new repository (e.g., `battery-management-system`)
   - DON'T initialize with README (we already have code)

3. **Push to GitHub**:
```bash
git remote add origin https://github.com/YOUR_USERNAME/battery-management-system.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend to Render

1. **Go to [Render Dashboard](https://dashboard.render.com)**

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:

| Setting | Value |
|---------|-------|
| **Name** | `battery-shop-api` |
| **Region** | Choose closest to you |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Docker` |
| **Dockerfile Path** | `./Dockerfile` |
| **Instance Type** | `Free` |

3. **Add Environment Variables**:

Click "Advanced" → "Add Environment Variable":

| Key | Value |
|-----|-------|
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `MongoDbSettings__ConnectionString` | Your MongoDB connection string |
| `MongoDbSettings__DatabaseName` | `BatteryShopDB` |
| `JwtSettings__SecretKey` | Generate a secure random string (32+ chars) |
| `JwtSettings__Issuer` | `BatteryShopAPI` |
| `JwtSettings__Audience` | `BatteryShopFrontend` |

4. **Click "Create Web Service"**

5. **Wait for Deployment** (~5-10 minutes)
   - Note your backend URL: `https://battery-shop-api.onrender.com`

---

## Step 3: Deploy Frontend to Render

1. **Create New Static Site**:
   - Click "New +" → "Static Site"
   - Select same GitHub repository

2. **Configure**:

| Setting | Value |
|---------|-------|
| **Name** | `battery-shop-frontend` |
| **Branch** | `main` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

3. **Add Environment Variable**:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://battery-shop-api.onrender.com/api` |

4. **Click "Create Static Site"**

5. **Wait for Deployment** (~3-5 minutes)
   - Note your frontend URL: `https://battery-shop-frontend.onrender.com`

---

## Step 4: Update Backend CORS

1. Go back to your **backend service** in Render
2. Add/Update Environment Variable:

| Key | Value |
|-----|-------|
| `Frontend__Url` | `https://battery-shop-frontend.onrender.com` |

3. Click "Save Changes" → Service will automatically redeploy

---

## Step 5: Test Your Application

1. **Open Frontend URL**: `https://battery-shop-frontend.onrender.com`

2. **Login** with your existing credentials or create a new admin user using MongoDB

---

## Creating Initial Admin User

### Option A: Using MongoDB Compass/Atlas

1. Connect to your MongoDB database
2. Navigate to `BatteryShopDB` → `Users` collection
3. Insert document:

```json
{
  "username": "admin",
  "passwordHash": "$2a$11$YourBCryptHashHere",
  "role": "Admin"
}
```

**To generate BCrypt hash**:
- Use [bcrypt-generator.com](https://bcrypt-generator.com/)
- Enter your password
- Copy the hash

---

## Important Notes

### ⚠️ Free Tier Limitations
- **Cold starts**: Services sleep after 15 min of inactivity
- **Wake up time**: ~30-60 seconds for first request
- **Monthly hours**: 750 hours/month per service

### 🔐 Security Checklist
- ✅ Use strong JWT secret (32+ characters)
- ✅ MongoDB uses username/password authentication
- ✅ CORS properly configured for your frontend URL only
- ✅ Change default admin password after first login

### 🐛 Troubleshooting

**CORS Error**:
- Verify `Frontend__Url` matches exact frontend URL
- Check browser console for specific error

**502 Bad Gateway**:
- Check backend logs in Render dashboard
- Verify MongoDB connection string is correct
- Ensure MongoDB allows connections from `0.0.0.0/0`

**MongoDB Connection Failed**:
- Whitelist all IPs (`0.0.0.0/0`) in MongoDB Atlas
- Check connection string format
- Verify database user credentials

**First Request Slow**:
- This is normal for Free tier (cold start)
- Consider keeping service warm or upgrade to paid tier

---

## Deployment Complete! 🎉

Your Battery Management System is now live!
