# PacePilot - Pacing Target Management System

A full-stack web application for managing pacing targets with user authentication, CSV bulk upload, and PostgreSQL integration for data validation.

## 🚀 Live Demo

[Deploy your own instance on Vercel](#deployment)

## ✨ Features

- **User Authentication**: Secure login system with JWT tokens
- **Pacing Target Management**: Create, edit, delete, and toggle status of pacing targets
- **CSV Bulk Upload**: Upload CSV files with validation against PostgreSQL database
- **PostgreSQL Integration**: Query tag master data for validation and reference
- **MongoDB Storage**: Store pacing targets and user data
- **Modern UI**: Responsive design with Tailwind CSS
- **Real-time Validation**: Validate CSV data against existing tags in PostgreSQL
- **Search & Filtering**: Advanced filtering by client, month, and tag name
- **Bulk Operations**: Efficient management of multiple targets

## 🛠️ Tech Stack

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Primary database (users and pacing targets)
- **PostgreSQL** - Reference database (tag master data)
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **Multer** - File upload handling
- **CSV Parser** - CSV file processing

### Frontend

- **HTML5** - Semantic markup
- **Tailwind CSS** - Utility-first CSS framework
- **Vanilla JavaScript** - ES6+ features with modern async/await
- **Responsive Design** - Mobile-first approach

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (v4.4 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd pacing-tracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `env.example` to `config.env` and update the values:

```bash
cp env.example config.env
```

Update `config.env` with your database credentials:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/pacing_tracker

# PostgreSQL Connection
POSTGRES_CONN=postgresql://username:password@host:port/database?ssl=true

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Server Port
PORT=3000
```

### 4. Set up databases

- Ensure MongoDB is running and accessible
- Ensure PostgreSQL is running with the required database
- The application expects a `tag_master` table structure

### 5. Start the application

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. **Fork/Clone this repository**
2. **Connect to Vercel**: [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/pacing-tracker)
3. **Configure environment variables** in Vercel dashboard
4. **Deploy!**

### Manual Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 📁 Project Structure

```
pacing-tracker/
├── config/           # Database configuration
├── middleware/       # Authentication middleware
├── models/          # MongoDB schemas
├── public/          # Frontend assets
│   ├── js/         # JavaScript files
│   └── index.html  # Main application
├── routes/          # API endpoints
├── uploads/         # File upload directory
├── server.js        # Main server file
├── vercel.json      # Vercel configuration
└── package.json     # Dependencies
```

## 🔧 API Endpoints

### Authentication

- `POST /api/auth/login` - User login

### Pacing Targets

- `GET /api/targets` - Get all targets
- `POST /api/targets` - Create new target
- `PUT /api/targets/:id` - Update target
- `DELETE /api/targets/:id` - Delete target
- `PATCH /api/targets/:id/toggle-status` - Toggle target status

### Tags & Clients

- `GET /api/tags/clients` - Get all clients
- `GET /api/tags/client/:id` - Get tags for specific client
- `GET /api/tags/filtered/:id` - Get filtered tags by type

### File Upload

- `POST /api/upload/validate` - Validate CSV file
- `POST /api/upload/csv` - Import CSV data
- `GET /api/upload/template` - Download CSV template

## 🎨 UI Components

- **Modern Dropdowns**: Searchable dropdowns with keyboard navigation
- **Responsive Tables**: Mobile-friendly data tables
- **Modal System**: Clean modal dialogs for forms
- **Progress Indicators**: File upload progress and validation status
- **Error Handling**: User-friendly error messages and validation

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation and sanitization
- File upload security

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

If you encounter any issues:

1. Check the [troubleshooting section](./DEPLOYMENT.md#-troubleshooting)
2. Review the [deployment guide](./DEPLOYMENT.md)
3. Open an issue on GitHub

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by real-world business requirements
- Designed for scalability and maintainability

---

**Made with ❤️ for efficient pacing target management**
