# User Management Guide

## Overview

This is a **development** setup with simplified password handling. Users can be added directly to the database with plain text passwords.

## ⚠️ **Security Notice**

- **This setup is for development purposes only**
- **Passwords are stored as plain text** (NOT recommended for production)
- **Use only in controlled, development environments**

## 🛠️ **How to Add Users**

### **Direct Database Insertion (Simplified for Development)**

1. **Connect to MongoDB** using MongoDB Compass or similar tool
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
- **password**: String (min 6 characters, stored as plain text for development)
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

## 🧪 **User Examples**

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

## 🔍 **Testing**

1. **Add users** directly to MongoDB using the examples above
2. **Test login** with the credentials you added
3. **Verify functionality** works as expected

## 🚨 **Important Notes**

1. **Plain Text Passwords**: Passwords are stored and compared as plain text
2. **No Encryption**: bcrypt has been removed for development simplicity
3. **Direct Database Access**: Users must be added directly to MongoDB
4. **Development Only**: This setup is NOT suitable for production use

## 📝 **Quick Test Commands**

### **Test Login API:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "demo", "password": "demo123"}'
```

## 🎯 **Workflow**

1. **Add users** directly to MongoDB
2. **Test login** with the added credentials
3. **Verify all features** work correctly
4. **Test the application** functionality

## 📞 **Support**

If you encounter issues:

1. Check server logs
2. Verify MongoDB connection
3. Ensure users exist in the database
4. Test with the login endpoint: `/api/auth/login`

## 🔄 **Converting to Production**

When ready to go live:

1. **Re-enable bcrypt** for password encryption
2. **Add password hashing** back to the User model
3. **Implement proper security** measures
4. **Remove plain text** password handling

---

**Remember: This is a development setup only! Never use plain text passwords in production!**
