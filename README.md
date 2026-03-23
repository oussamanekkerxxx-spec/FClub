# SkillClub - Community Learning Platform

A modern community-driven learning platform that connects people who want to teach with those who want to learn. Built with React, Express, and PostgreSQL.

## 🚀 Features

- **User Authentication**: Secure signup/login with Supabase Auth and email verification
- **Skill Matching**: Connect teachers and learners based on interests and location
- **User Profiles**: Rich profiles with skills, interests, trust scores, and reviews
- **Community Feed**: Discover learning opportunities and teaching sessions
- **Real-time Updates**: WebSocket integration for live notifications

## 🛠 Tech Stack

### Frontend
- **React 19** - Modern UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast development and building
- **Tailwind CSS** - Utility-first styling
- **React Router v7** - Client-side routing
- **Supabase Client** - Authentication and real-time features
- **Zustand** - State management

### Backend
- **Express.js 5** - Node.js web framework
- **TypeScript** - Type-safe API development
- **Prisma ORM** - Database management
- **PostgreSQL** - Database (via Supabase)
- **CORS & Helmet** - Security middleware

### Database
- **Supabase PostgreSQL** - Hosted database
- **Prisma** - Schema management and migrations
- **Connection Pooler** - Optimized database connections

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Clone the repository
```bash
git clone https://github.com/yourusername/skillclub.git
cd skillclub
```

### Install dependencies
```bash
npm install
```

### Environment Setup

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Database Configuration (for backend)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:5432/postgres"

# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### Database Setup

1. Create a Supabase project at https://supabase.com
2. Get your connection details from Project Settings → Database
3. Run Prisma migrations:
```bash
npx prisma migrate dev
npx prisma generate
```

## 🚀 Running the Application

### Development Mode (Frontend + Backend)
```bash
# Run both frontend and backend
npm run dev:full

# Or run separately:
npm run dev          # Frontend only (Vite)
npm run server:dev   # Backend only (Express with hot reload)
```

### Production Build
```bash
# Build frontend
npm run build

# Start backend server
npm run server
```

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Endpoints

#### Health Check
```
GET /api/health
Response: { status: "OK", timestamp: "2024-..." }
```

#### Users
```
GET    /api/users          # List all users
GET    /api/users/:id      # Get user by ID
POST   /api/users          # Create user
PUT    /api/users/:id      # Update user
DELETE /api/users/:id      # Delete user
```

## 🗄 Database Schema

### Models

#### User
- `id` - Primary key
- `email` - Unique email address
- `name` - User display name
- `createdAt` - Registration date
- `updatedAt` - Last update timestamp

#### Profile
- `id` - Primary key
- `bio` - User biography
- `avatar` - Profile image URL
- `userId` - Reference to User (one-to-one)

#### Post
- `id` - Primary key
- `title` - Post title
- `content` - Post content
- `published` - Publication status
- `authorId` - Reference to User

## 🔧 Configuration

### Vite Config
The frontend runs on port 5173 with WebSocket HMR support for hot module replacement.

### Express Server
The backend API runs on port 3001 with:
- CORS enabled for frontend communication
- Helmet for security headers
- JSON body parsing
- Error handling middleware

### Database Connection
Uses Supabase PostgreSQL with connection pooling:
- **Session Pooler** (port 5432): For migrations and schema changes
- **Transaction Pooler** (port 6543): For application queries

## 🧪 Testing

### Frontend
```bash
npm run dev
# Access at http://localhost:5173
```

### Backend
```bash
npm run server
# Test API at http://localhost:3001/api/health
```

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run server` | Start Express backend |
| `npm run server:dev` | Start backend with hot reload |
| `npm run dev:full` | Run both frontend and backend |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## 🐛 Troubleshooting

### WebSocket Connection Errors
- Ensure Vite config has correct HMR port settings
- Clear browser cache and restart dev server

### Database Connection Issues
- Verify DATABASE_URL in .env file
- Use session pooler (port 5432) for migrations
- Use transaction pooler (port 6543) for runtime

### 429 Too Many Requests
- Supabase rate limits signups per IP
- Wait 60 seconds and try again, or use a different network

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Backend-as-a-Service
- [Prisma](https://prisma.io) - Database ORM
- [Tailwind CSS](https://tailwindcss.com) - CSS Framework
- [Vite](https://vitejs.dev) - Build Tool
- [Express](https://expressjs.com) - Web Framework

---

Built with ❤️ by the SkillClub team
