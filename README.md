# SSMPTC Events

A fully responsive event management website with Owner/Admin panels and student registrations, designed with makemypass.com inspired theme.

## 🚀 Features
- **Modern Design**: Black, green, and white theme inspired by makemypass.com
- **Responsive Layout**: Optimized for both mobile and desktop
- **Event Management**: Homepage shows Upcoming, Present, Past events
- **Advanced Search**: Search & filters (department, semester, type)
- **Registration System**: One-time registration per program per Roll No
- **Student Portal**: "My Registrations" page with print support
- **Admin Dashboard**: Complete event, program, and registration management
- **Owner Panel**: Admin user management
- **Database**: MongoDB integration with file-based fallback

## 🎯 Quick Start

### Local Development
```bash
# Clone repository
git clone <your-repo-url>
cd ssmptc-events

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your MongoDB URI
# MONGODB_URI=mongodb+srv://...

# Start development server
npm start
```

Then open: http://localhost:3000

### Default Login Credentials
**Owner Account:**
- ID: `COSMIC`
- Password: `VVVS2025`

**Admin Accounts:**
- ID: `admin1`, Password: `admin123`
- ID: `eventsLead`, Password: `events2025`

## 🏗️ Project Structure
```
ssmptc-events/
├── server.js              # Express server + API routes
├── store.js               # Database abstraction (MongoDB + File fallback)
├── package.json           # Dependencies and scripts
├── render.yaml           # Render deployment configuration
├── .env.example          # Environment variables template
├── public/               # Frontend files
│   ├── index.html        # Main HTML with makemypass theme
│   ├── app.js            # Frontend JavaScript
│   └── assets/           # Images and logos
├── data/                 # JSON fallback files
│   ├── admins.json       # Admin users
│   ├── events.json       # Events data
│   ├── programs.json     # Programs data
│   └── registrations.json # Student registrations
└── .github/workflows/    # GitHub Actions (optional)
```

## 🎨 Design Features
- **makemypass.com Theme**: Professional black, green, white color scheme
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Modern UI**: Clean cards, smooth animations, hover effects
- **Touch-Friendly**: Optimized button sizes and spacing for mobile
- **Print Support**: Registration receipts can be printed/saved as PDF

## 🔐 Security Features
- JWT authentication for admin/owner access
- Environment variables for sensitive data
- Input validation and sanitization
- CORS enabled for frontend-backend communication
- One-time registration per program per student

## 📱 Mobile Optimization
- Collapsible filter section
- Touch-friendly buttons and inputs
- Responsive navigation menu
- Optimized modal dialogs
- Mobile-friendly admin dashboard

## 🛠️ Technology Stack
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (with JSON file fallback)
- **Frontend**: Vanilla JavaScript, Tailwind CSS
- **Authentication**: JWT tokens
- **Deployment**: Render.com ready

## 📞 Support
For issues or questions:
1. Check the server logs in your deployment platform
2. Verify MongoDB connection settings
3. Ensure all environment variables are properly set
4. Review the API endpoints in server.js

## 📄 License
This project is open source and available under the MIT License.