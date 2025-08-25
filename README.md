# PacePilot - Pacing Target Management System

An enterprise-grade web application for managing pacing targets with advanced user authentication, CSV bulk upload capabilities, and real-time PostgreSQL integration for comprehensive data validation.

## 🚀 Getting Started

Get up and running with PacePilot in minutes. Perfect for enterprise environments and production deployments.

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
# Environment
NODE_ENV=development

# MongoDB Connection (local or cloud)
MONGODB_URI=mongodb://localhost:27017/pacing_tracker

# PostgreSQL Connection
POSTGRES_CONN=postgresql://username:password@host:port/database?ssl=true

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Server Port
PORT=3000
```

### 4. Set up databases

- **MongoDB**: Install and start MongoDB or configure cloud instance
- **PostgreSQL**: Configure connection to your PostgreSQL database
- The application expects a `tag_master` table structure in PostgreSQL

### 5. Start the application

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

## 🚀 Development & Production

### Environment Setup

The application supports both development and production environments through environment variables:

- **Development**: Uses local databases and default settings
- **Production**: Configure cloud databases and production settings

### Local Development

1. **Clone this repository**
2. **Install dependencies**: `npm install`
3. **Configure environment variables** in `config.env\*\*
4. **Start MongoDB** or configure cloud instance
5. **Run the application**: `npm run dev`

### Production Deployment

1. **Set production environment variables**
2. **Configure production databases (MongoDB Atlas, AWS RDS, etc.)**
3. **Deploy to your preferred hosting platform (Vercel, AWS, Heroku, etc.)**
4. **Run**: `npm start`

### Prerequisites

- MongoDB (local or cloud)
- PostgreSQL access
- Node.js v18 or higher

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

## 🚀 Deployment

### Quick Deploy Options

- **Vercel**: Connect your GitHub repo and deploy instantly
- **Heroku**: Use the Heroku CLI for easy deployment
- **AWS**: Deploy to EC2 or use Elastic Beanstalk
- **DigitalOcean**: Use App Platform for simple deployment

### Environment Variables for Production

Set these in your hosting platform:

- `NODE_ENV`: Set to `production` (enables production optimizations)
- `MONGODB_URI`: Your production MongoDB connection string
- `POSTGRES_CONN`: Your production PostgreSQL connection string
- `JWT_SECRET`: Strong secret key for production
- `PORT`: Server port (usually set automatically by hosting platform)

### Environment-Specific Features

- **Development Mode** (`NODE_ENV=development`):

  - Loads configuration from `config.env` file
  - Verbose logging and debugging
  - Development-optimized database connections

- **Production Mode** (`NODE_ENV=production`):
  - Uses environment variables directly
  - Production-optimized database pools
  - Security headers enabled
  - Minimal logging

## 🆘 Support

If you encounter any issues:

1. Check server logs and database connections
2. Verify environment variables are set correctly
3. Open an issue on GitHub

## 🙏 Acknowledgments

- Built with enterprise-grade web technologies
- Designed for real-world business requirements
- Engineered for scalability, maintainability, and production use

---

**Built for enterprise-grade pacing target management**
