# Social Network Application

A full-stack social network application built with Node.js/Express backend and React frontend.

## Features

### Backend (Server)
- **Authentication**: JWT-based auth with access/refresh tokens
- **Google OAuth**: Login with Google account
- **Posts**: Create, read, update, delete posts with image support
- **Comments**: Nested comments on posts
- **Likes**: Like/unlike posts
- **User Profiles**: View and edit user profiles
- **AI Integration**: Smart search using Gemini/OpenAI
- **File Upload**: Image upload with Multer
- **HTTPS Support**: Production-ready HTTPS configuration
- **API Documentation**: Swagger/OpenAPI docs
- **Testing**: Jest test suite

### Frontend (Client)
- **React 18** with TypeScript
- **Material-UI (MUI)** for styling
- **React Router** for navigation
- **Infinite Scroll** feed
- **Real-time like updates**
- **AI-powered smart search**
- **Profile management**
- **Responsive design**

## Tech Stack

### Backend
- Node.js + Express 5
- TypeScript
- MongoDB + Mongoose
- JWT Authentication
- Multer (file uploads)
- Swagger (API docs)
- Jest (testing)
- PM2 (process management)

### Frontend
- React 18
- Vite
- TypeScript
- Material-UI 5
- Axios
- React Router 6
- Google OAuth

## Project Structure

```
├── server/
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth middleware
│   │   ├── model/           # Mongoose models
│   │   ├── routes/          # API routes
│   │   ├── tests/           # Jest tests
│   │   ├── index.ts         # App configuration
│   │   ├── server.ts        # Server entry point
│   │   └── swagger.ts       # Swagger configuration
│   ├── public/              # Static files
│   └── scripts/             # Utility scripts
│
├── client/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── context/         # React context
│   │   ├── types/           # TypeScript types
│   │   └── theme.ts         # MUI theme
│   └── public/              # Static assets
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Environment Setup

#### Server (.env.dev)
```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/social-network
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your_google_client_id
GEMINI_API_KEY=your_gemini_api_key
# or
OPENAI_API_KEY=your_openai_api_key
```

#### Client (.env)
```env
VITE_API_URL=http://localhost:4000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd final
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

### Running the Application

#### Development Mode

**Server:**
```bash
cd server
npm run dev
```
Server runs on http://localhost:4000

**Client:**
```bash
cd client
npm run dev
```
Client runs on http://localhost:5173

#### Production Mode

**Server:**
```bash
cd server
npm run build
npm start
```

**Client:**
```bash
cd client
npm run build
npm run preview
```

### Running Tests

```bash
cd server
npm test
```

### API Documentation

When the server is running, visit:
- http://localhost:4000/api-docs (Swagger UI)

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/google` - Google OAuth login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user

### Posts
- `GET /posts` - Get posts (paginated)
- `GET /posts/:id` - Get single post
- `POST /posts` - Create post
- `PUT /posts/:id` - Update post
- `DELETE /posts/:id` - Delete post
- `POST /posts/:id/like` - Toggle like

### Comments
- `GET /comments/post/:postId` - Get comments for post
- `POST /comments` - Create comment
- `PUT /comments/:id` - Update comment
- `DELETE /comments/:id` - Delete comment

### Users
- `GET /users/profile` - Get own profile
- `GET /users/:id` - Get user profile
- `PUT /users/profile` - Update profile

### AI
- `POST /ai/smart-search` - AI-powered search
- `POST /ai/analyze` - Analyze post content
- `POST /ai/suggestions` - Get content suggestions

### Upload
- `POST /upload` - Upload image

## HTTPS Setup (Production)

1. Generate SSL certificates:
   ```bash
   cd server
   npm run generate-certs
   ```

2. Set environment variables:
   ```env
   HTTPS=true
   SSL_KEY_PATH=./certs/key.pem
   SSL_CERT_PATH=./certs/cert.pem
   ```

## PM2 Deployment

```bash
cd server
npm install -g pm2
pm2 start ecosystem.config.js
```

## License

MIT
