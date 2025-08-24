# Deployment Guide for Pacing Tracker

This guide will help you deploy your Pacing Tracker application to GitHub and Vercel, and connect MongoDB Compass to MongoDB Atlas.

## 🚀 Step 1: Prepare for GitHub

### 1.1 Initialize Git Repository

```bash
git init
git add .
git commit -m "Initial commit: Pacing Tracker application"
```

### 1.2 Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `pacing-tracker` or your preferred name
3. Make it public or private as per your preference
4. **DO NOT** initialize with README, .gitignore, or license (we already have these)

### 1.3 Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/pacing-tracker.git
git branch -M main
git push -u origin main
```

## ☁️ Step 2: Deploy to Vercel

### 2.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 2.2 Deploy to Vercel

```bash
vercel
```

Follow the prompts:

- Set up and deploy: `Y`
- Which scope: Select your account
- Link to existing project: `N`
- Project name: `pacing-tracker` (or your preferred name)
- Directory: `./` (current directory)
- Override settings: `N`

### 2.3 Configure Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add the following variables:

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
POSTGRES_CONN=postgresql://<username>:<password>@<host>:<port>/<database>?ssl=true
JWT_SECRET=your_secure_jwt_secret_here
NODE_ENV=production
```

### 2.4 Redeploy with Environment Variables

```bash
vercel --prod
```

## 🗄️ Step 3: MongoDB Atlas Setup

### 3.1 Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account
3. Create a new project

### 3.2 Create Cluster

1. Click "Build a Database"
2. Choose "FREE" tier (M0)
3. Select cloud provider and region
4. Click "Create"

### 3.3 Configure Database Access

1. Go to Security → Database Access
2. Click "Add New Database User"
3. Create username and password
4. Select "Read and write to any database"
5. Click "Add User"

### 3.4 Configure Network Access

1. Go to Security → Network Access
2. Click "Add IP Address"
3. For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
4. For production: Add specific IP addresses

### 3.5 Get Connection String

1. Go to Databases → Connect
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<username>`, `<password>`, `<database>` with your values

## 🔧 Step 4: Update Environment Variables

### 4.1 Update Vercel Environment Variables

Replace the placeholder values in Vercel with your actual MongoDB Atlas connection string.

### 4.2 Test Connection

Redeploy your application and test the MongoDB connection.

## 📱 Step 5: Connect MongoDB Compass to Atlas

### 5.1 Download MongoDB Compass

1. Go to [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Download and install for your OS

### 5.2 Connect to Atlas

1. Open MongoDB Compass
2. Click "New Connection"
3. Paste your MongoDB Atlas connection string
4. Click "Connect"

### 5.3 Navigate Your Database

1. You'll see your cluster
2. Click on your database name
3. Explore collections and documents

## 🔒 Step 6: Security Considerations

### 6.1 JWT Secret

- Generate a strong, random JWT secret
- Use a password generator or run: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### 6.2 Environment Variables

- Never commit sensitive information to GitHub
- Use Vercel's environment variable system
- Keep your `config.env` file local only

### 6.3 Database Security

- Use strong passwords for database users
- Restrict network access to necessary IPs only
- Regularly rotate credentials

## 🚨 Troubleshooting

### Common Issues:

1. **MongoDB Connection Failed**

   - Check connection string format
   - Verify username/password
   - Check network access settings

2. **Vercel Deployment Failed**

   - Check environment variables
   - Verify `vercel.json` configuration
   - Check build logs

3. **CORS Issues**
   - Verify your frontend domain is allowed
   - Check CORS configuration in server.js

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB Compass Documentation](https://docs.mongodb.com/compass/)

## 🎯 Next Steps

After successful deployment:

1. Test all functionality in production
2. Set up monitoring and logging
3. Configure custom domain (optional)
4. Set up CI/CD pipeline (optional)
5. Monitor performance and optimize

---

**Note**: Keep your local `config.env` file for development and use Vercel's environment variables for production. Never commit sensitive information to your GitHub repository.
