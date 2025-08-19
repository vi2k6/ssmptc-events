# 🚀 SSMPTC Events - Render Deployment Guide

## Prerequisites
- GitHub account
- Render account (free tier available)
- MongoDB Atlas account (free tier available)

## Step 1: Setup MongoDB Atlas
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account and cluster
3. Create a database user with read/write permissions
4. Get your connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/ssmptc-events?retryWrites=true&w=majority
   ```
5. **Important**: Whitelist all IP addresses (0.0.0.0/0) for Render deployment

## Step 2: Prepare GitHub Repository
1. Push all files to your GitHub repository
2. Make sure `.env` is in `.gitignore` (never commit sensitive data)
3. Ensure `render.yaml` is in the root directory

## Step 3: Deploy on Render

### Option A: Using render.yaml (Recommended)
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically read the `render.yaml` configuration
5. Set the environment variables (see Step 4)

### Option B: Manual Setup
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `ssmptc-events`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for better performance)

## Step 4: Environment Variables
In Render dashboard, add these environment variables:

### Required Variables:
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ssmptc-events?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random-at-least-32-characters
NODE_ENV=production
```

### Optional Variables:
```bash
PORT=3000
```

**⚠️ Important**: 
- Replace `MONGODB_URI` with your actual MongoDB Atlas connection string
- Generate a strong `JWT_SECRET` (at least 32 characters)
- Never share these values publicly

## Step 5: Deploy
1. Click "Create Web Service" or "Deploy Blueprint"
2. Render will automatically build and deploy your app
3. You'll get a URL like: `https://ssmptc-events.onrender.com`
4. First deployment may take 5-10 minutes

## Step 6: Verify Deployment
1. Visit your Render URL
2. Check that the homepage loads with events
3. Test the login functionality:
   - Owner: ID `COSMIC`, Password `VVVS2025`
   - Admin: ID `admin1`, Password `admin123`

## 🔧 Environment Variables Explained

### MONGODB_URI
Your MongoDB Atlas connection string. Format:
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

### JWT_SECRET
A secret key for signing JWT tokens. Generate a strong one:
```bash
# Example (don't use this exact one):
JWT_SECRET=my-super-secret-jwt-key-for-ssmptc-events-2025-make-it-very-long-and-random
```

### NODE_ENV
Set to `production` for deployment optimizations.

## 🚨 Troubleshooting

### Common Issues:

1. **Build Failed**
   - Check that all dependencies are in `package.json`
   - Verify Node.js version compatibility

2. **MongoDB Connection Failed**
   - Verify your connection string is correct
   - Check that IP whitelist includes 0.0.0.0/0
   - Ensure database user has proper permissions

3. **Environment Variables Not Working**
   - Double-check variable names (case-sensitive)
   - Ensure no extra spaces in values
   - Verify JWT_SECRET is set

4. **App Crashes on Startup**
   - Check Render logs in the dashboard
   - Verify all required environment variables are set

### Checking Logs:
1. Go to your Render dashboard
2. Click on your service
3. Go to "Logs" tab
4. Look for error messages

### Testing Locally:
```bash
# Test with your production environment variables
MONGODB_URI="your-atlas-uri" JWT_SECRET="your-secret" npm start
```

## 🔄 Updates and Redeployment
- Push changes to your GitHub repository
- Render will automatically redeploy
- Check the "Events" tab in Render dashboard for deployment status

## 📊 Monitoring
- **Render Dashboard**: Monitor app performance and logs
- **MongoDB Atlas**: Monitor database usage and performance
- **Health Check**: Your app responds at `/api/events` endpoint

## 💰 Cost Considerations
- **Render Free Tier**: 750 hours/month, sleeps after 15 minutes of inactivity
- **MongoDB Atlas Free Tier**: 512MB storage, sufficient for small to medium usage
- **Upgrade**: Consider paid plans for production use with high traffic

## 🔒 Security Best Practices
1. **Never commit `.env` files** to GitHub
2. **Use strong JWT secrets** (32+ characters)
3. **Regularly rotate secrets** in production
4. **Monitor access logs** in both Render and MongoDB Atlas
5. **Keep dependencies updated** with `npm audit`

## 📞 Support Resources
- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Node.js Deployment Guide](https://render.com/docs/deploy-node-express-app)

---

🎉 **Congratulations!** Your SSMPTC Events website is now live on Render with MongoDB Atlas!