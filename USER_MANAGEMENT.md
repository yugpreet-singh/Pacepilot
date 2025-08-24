# User Management Guide (Demo Setup)

## Overview

This is a **DEMO VERSION** with simplified password handling. Users can be added directly to the database with plain text passwords.

## ⚠️ **Demo Security Notice**

- **This setup is for DEMONSTRATION purposes only**
- **Passwords are stored as plain text** (NOT recommended for production)
- **Use only in controlled, demo environments**

## 🛠️ **How to Add Users**

### **Direct Database Insertion (Simplified for Demo)**

1. **Connect to MongoDB Atlas** using MongoDB Compass or similar tool
2. **Navigate to your database** (pacing_tracker)
3. **Go to the `users` collection**
4. **Insert a new document** with this structure:

```json
{
  "username": "demo_user",
  "email": "demo@example.com",
  "password": "demo123",
  "createdAt": "2025-08-24T00:00:00.000Z"
}
```

### **Required Fields:**

- **username**: String (min 3 characters, must be unique)
- **email**: String (must be unique, will be converted to lowercase)
- **password**: String (min 6 characters, stored as plain text for demo)
- **createdAt**: Date (optional, defaults to current time)

## 📊 **Database Schema**

Users are stored with this structure:

```json
{
  "_id": "ObjectId (auto-generated)",
  "username": "string (unique, min 3 chars)",
  "email": "string (unique, lowercase)",
  "password": "string (plain text for demo)",
  "createdAt": "Date"
}
```

## 🧪 **Demo User Examples**

### **Example 1: Admin User**

```json
{
  "username": "admin",
  "email": "admin@demo.com",
  "password": "admin123"
}
```

### **Example 2: Demo User**

```json
{
  "username": "demo",
  "email": "demo@example.com",
  "password": "demo123"
}
```

### **Example 3: Test User**

```json
{
  "username": "test",
  "email": "test@demo.com",
  "password": "test123"
}
```

## 🔍 **Testing the Demo**

1. **Add users** directly to MongoDB using the examples above
2. **Test login** with the credentials you added
3. **Verify functionality** works as expected

## 🚨 **Important Demo Notes**

1. **Plain Text Passwords**: Passwords are stored and compared as plain text
2. **No Encryption**: bcrypt has been removed for demo simplicity
3. **Direct Database Access**: Users must be added directly to MongoDB
4. **Demo Only**: This setup is NOT suitable for production use

## 📝 **Quick Test Commands**

### **Test Login API:**

```bash
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "demo", "password": "demo123"}'
```

### **Test Health Check:**

```bash
curl https://your-app.vercel.app/api/auth/health
```

## 🎯 **Demo Workflow**

1. **Add users** directly to MongoDB Atlas
2. **Test login** with the added credentials
3. **Verify all features** work correctly
4. **Show the demo** to stakeholders

## 📞 **Demo Support**

If you encounter issues:

1. Check Vercel function logs
2. Verify MongoDB Atlas connection
3. Ensure users exist in the database
4. Test with the health check endpoint: `/api/auth/health`

## 🔄 **Converting to Production**

When ready to go live:

1. **Re-enable bcrypt** for password encryption
2. **Add password hashing** back to the User model
3. **Implement proper security** measures
4. **Remove plain text** password handling

---

**Remember: This is a DEMO setup only! Never use plain text passwords in production!**
