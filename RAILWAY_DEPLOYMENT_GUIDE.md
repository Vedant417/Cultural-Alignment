# 🚀 Railway Deployment Guide - CultureAlign

Complete step-by-step guide for deploying the CultureAlign application on Railway with Backend (FastAPI), Frontend (Next.js), and MongoDB.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Overview](#project-overview)
3. [Step-by-Step Deployment](#step-by-step-deployment)
4. [Environment Variables Setup](#environment-variables-setup)
5. [Docker Configuration Details](#docker-configuration-details)
6. [Service Integration](#service-integration)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### What You Need Before Starting

1. **Railway Account**
   - Go to https://railway.app
   - Sign up (GitHub, Google, or Email)
   - Billing account set up (even for free tier)

2. **Git Repository**
   - Your code must be on GitHub
   - Repository should be public or connected to Railway
   - Latest code pushed to main branch

3. **Required Tools Installed**
   - Git (for version control)
   - Docker (for local testing)
   - Node.js v18+ (for frontend development)
   - Python 3.11+ (for backend development)

4. **API Keys & Credentials**
   - TMDB API Key (from https://www.themoviedb.org/settings/api)
   - MongoDB connection string (Railway will create this)
   - Ollama setup (local or remote server)

---

## Project Overview

### Workspace Structure
```
c:\Users\msoor\Desktop\entertainment_tech\culture-alignment\
├── Dockerfile.backend          ← Backend Docker configuration
├── Dockerfile.frontend         ← Frontend Docker configuration
├── railway.json                ← Railway configuration file
├── README.md                   ← Project documentation
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── requirements.txt
│   ├── db/
│   │   ├── __init__.py
│   │   ├── connection.py
│   │   └── models.py
│   ├── modules/
│   │   ├── tmdb.py
│   │   ├── scorer.py
│   │   └── ... other modules
│   └── routers/
│       ├── analyze.py
│       ├── compare.py
│       └── ... other routers
└── frontend/
    ├── package.json
    ├── next.config.mjs
    ├── app/
    │   ├── page.tsx
    │   └── ... other pages
    └── components/
        ├── ... component files
```

### Technology Stack
| Component | Technology | Version |
|-----------|-----------|---------|
| Backend | FastAPI | 0.135.3 |
| Frontend | Next.js | 14.2.3 |
| Runtime (Backend) | Python | 3.11 |
| Runtime (Frontend) | Node.js | 18-alpine |
| Database | MongoDB | (Railway managed) |
| API Source | TMDB | v3 |
| AI Engine | Ollama | (local/remote) |

---

## Step-by-Step Deployment

### STEP 1: Create Railway Project

#### Where: Railway Dashboard
**Location:** https://railway.app/dashboard

#### What to Do:
1. Click **"New Project"** button (top right)
2. Select **"Deploy from GitHub"**
3. Choose your repository: `culture-alignment`
4. Click **"Deploy Now"**

#### Result:
- Railway will detect your repository
- Creates a new project workspace
- Initializes deployment pipeline

---

### STEP 2: Update railway.json Configuration

#### File Location:
```
c:\Users\msoor\Desktop\entertainment_tech\culture-alignment\railway.json
```

#### Current Content:
```json
{
  "$schema": "https://railway.app/schema.json",
  "build": {
    "builder": "dockerfile"
  },
  "deploy": {
    "numReplicas": 1,
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT"
  }
}
```

#### What This Does:
- **builder**: `"dockerfile"` - Tells Railway to use Docker files for building
- **numReplicas**: `1` - Runs 1 instance of the service (use more for scaling)
- **startCommand**: Runs the FastAPI backend server on the assigned port

#### Where to Update:
✅ **Already Configured** - The file is ready for deployment

#### Reference:
- Railway Schema: https://railway.app/schema.json
- Configuration: Applies to **Backend service** only

---

### STEP 3: Configure Backend Service

#### File Location (Backend Dockerfile):
```
c:\Users\msoor\Desktop\entertainment_tech\culture-alignment\Dockerfile.backend
```

#### Current Dockerfile Content:
```dockerfile
# Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Expose port
EXPOSE 8000

# Run the app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### What This Does:
1. **Base Image**: `python:3.11-slim` - Lightweight Python 3.11 environment
2. **Working Directory**: `/app` - Sets container working directory
3. **System Dependencies**: `gcc` - Compiler needed for some Python packages
4. **Requirements Installation**: Installs all packages from `requirements.txt`
5. **Copy Code**: Copies backend folder into container
6. **Expose Port**: Makes port 8000 available
7. **Start Command**: Runs FastAPI with Uvicorn server

#### Backend Requirements (requirements.txt):
```
File Location: c:\Users\msoor\Desktop\entertainment_tech\culture-alignment\backend\requirements.txt

Key Dependencies:
- fastapi==0.135.3           # Web framework
- uvicorn==0.44.0            # ASGI server
- pymongo==4.16.0            # MongoDB driver
- motor==3.7.1               # Async MongoDB
- pydantic==2.12.5           # Data validation
- python-dotenv==1.2.2       # Environment variables
- requests==2.33.1           # HTTP client
- groq==1.1.2                # Groq API (if using)
- httpx==0.28.1              # Async HTTP client
```

#### Settings in Railway Dashboard:

**Path:** Dashboard → Project → Services → Add Service → Dockerfile

| Setting | Value | Notes |
|---------|-------|-------|
| **Service Name** | `backend` | Identifier for the service |
| **Dockerfile Path** | `Dockerfile.backend` | Relative path from root |
| **Port** | `8000` | Internal container port |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` | Railway automatically assigns `$PORT` |

---

### STEP 4: Configure Frontend Service

#### File Location (Frontend Dockerfile):
```
c:\Users\msoor\Desktop\entertainment_tech\culture-alignment\Dockerfile.frontend
```

#### Current Dockerfile Content:
```dockerfile
# Frontend Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy app code
COPY frontend/ .

# Build the Next.js app
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built app from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 3000

# Run the app
CMD ["npm", "start"]
```

#### What This Does:
1. **Builder Stage**:
   - Uses `node:18-alpine` (lightweight Node.js)
   - Installs all dependencies
   - Builds Next.js project
   - Creates optimized `.next` folder

2. **Production Stage**:
   - Fresh Node.js environment (smaller final image)
   - Copies only production dependencies
   - Copies built `.next` and `public` folders
   - Runs `npm start` for production server

#### Frontend package.json Key Scripts:
```json
File Location: c:\Users\msoor\Desktop\entertainment_tech\culture-alignment\frontend\package.json

"scripts": {
  "dev": "next dev",           # Development server (local only)
  "build": "next build",       # Production build
  "start": "next start",       # Production server
  "lint": "next lint"          # Code linting
}
```

#### Frontend Dependencies:
```
Key Packages (from package.json):
- next@14.2.3                  # React framework
- react@^18                    # React library
- react-dom@^18                # React DOM
- typescript@^6.0.2            # TypeScript support
- tailwindcss@^3.4.1           # CSS framework
- chart.js@^4.5.1              # Charts/graphs
- react-chartjs-2@^5.3.1       # Chart integration
- lucide-react@^0.383.0        # Icons
```

#### Settings in Railway Dashboard:

**Path:** Dashboard → Project → Services → Add Service → Dockerfile

| Setting | Value | Notes |
|---------|-------|-------|
| **Service Name** | `frontend` | Identifier for the service |
| **Dockerfile Path** | `Dockerfile.frontend` | Relative path from root |
| **Port** | `3000` | Default Next.js port |
| **Build Command** | `npm run build` | Already defined in Dockerfile |
| **Start Command** | `npm start` | Already defined in Dockerfile |

---

### STEP 5: Add MongoDB Service

#### Where: Railway Dashboard

#### Steps:
1. **Go to Project Dashboard**
   - Path: https://railway.app/project/{PROJECT_ID}

2. **Add New Service**
   - Click **"+ Add Service"** button
   - Select **"Database"**
   - Choose **"MongoDB"**

3. **Configuration** (Railway Auto-Configures)
   - Database name: Auto-generated (e.g., `railway`)
   - Default user: `admin`
   - Default password: Auto-generated
   - Connection string: Auto-generated

#### Get MongoDB Connection String:

**In Railway Dashboard:**
1. Click on **MongoDB service**
2. Go to **"Variables"** tab
3. Look for: **`DATABASE_URL`** or **`MONGODB_URL`**
4. Copy the full connection string

**Format:**
```
mongodb+srv://admin:PASSWORD@cluster.railway.internal:27017/railway?retryWrites=true&w=majority
```

#### MongoDB Variables Available:
| Variable | Value | Use Case |
|----------|-------|----------|
| `DATABASE_URL` | Full connection string | Backend connection |
| `MONGO_URL` | Full connection string | Alternative |
| `MONGODB_HOST` | Host only | Custom connections |
| `MONGODB_PORT` | Port number | Custom connections |
| `MONGODB_USERNAME` | Username | Custom connections |
| `MONGODB_PASSWORD` | Password | Custom connections |
| `MONGODB_DB` | Database name | Database selection |

---

### STEP 6: Set Environment Variables

#### Where: Railway Dashboard → Services → Variables

#### Backend Environment Variables

**Go to:** Dashboard → Project → Backend Service → Variables Tab

**Required Variables:**

| Variable Name | Value | Where to Get | File Reference |
|---------------|-------|-------------|-----------------|
| `TMDB_API_KEY` | Your TMDB API key | https://www.themoviedb.org/settings/api | `backend/config.py` |
| `MONGODB_URI` | MongoDB connection string | From MongoDB service variables | `backend/db/connection.py` |
| `MONGODB_DB` | `culture_align` | Default database name | `backend/config.py` |
| `OLLAMA_BASE_URL` | `http://localhost:11434` or remote | Your Ollama instance | `backend/modules/ollama_client.py` |
| `OLLAMA_MODEL` | `llama3` | Your model name | `backend/modules/ollama_client.py` |

#### Where to Add Them in Dashboard:

1. **Open Service Settings**
   ```
   Dashboard → Your Project → backend → Variables
   ```

2. **Click "Add Variable"**
3. **Enter Key-Value Pair**
   ```
   Key: TMDB_API_KEY
   Value: your_actual_api_key_here
   ```

4. **Repeat for each variable**

#### Backend Configuration Files Reference:

**`backend/config.py`** - Where settings are loaded:
```python
# This file loads environment variables
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    tmdb_api_key: str          # from TMDB_API_KEY
    mongodb_uri: str           # from MONGODB_URI
    mongodb_db: str = "culture_align"  # from MONGODB_DB
    ollama_base_url: str       # from OLLAMA_BASE_URL
    ollama_model: str = "llama3"  # from OLLAMA_MODEL
```

**`backend/db/connection.py`** - MongoDB connection:
```python
# Uses MONGODB_URI from environment
# MongoDB connection setup
```

---

### STEP 7: Frontend Environment Variables

#### Where: Railway Dashboard → Frontend Service → Variables

**Required Variables:**

| Variable Name | Value | Where to Set |
|---------------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://backend-service-url.railway.app` | Railroad service domains |
| `API_BASE_URL` | Backend service URL (internal) | Same as above |
| `NEXT_PUBLIC_ENVIRONMENT` | `production` | For environment detection |

#### Getting Backend Service URL:

1. **Go to Backend Service Settings**
   - Dashboard → Project → backend → Settings

2. **Find "Deployments" or "Domains"**
   - Look for: `https://culture-alignment-production.railway.app`
   - This is your `NEXT_PUBLIC_API_URL`

#### Frontend Configuration Files Reference:

**`frontend/lib/api.ts`** - API base URL setup:
```typescript
// Uses process.env.NEXT_PUBLIC_API_URL for client-side API calls
// Automatically created during build
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
```

**`frontend/next.config.mjs`** - Next.js configuration:
```javascript
File Location: c:\Users\msoor\Desktop\entertainment_tech\culture-alignment\frontend\next.config.mjs

// Add environment variable rewrites if needed
```

---

### STEP 8: Configure Service Connections

#### Connect Frontend → Backend

**In Railway Dashboard:**

1. **Go to Frontend Service**
   - Settings → Variables

2. **Add Backend Reference**
   ```
   NEXT_PUBLIC_API_URL = ${{ services.backend.RAILWAY_PUBLIC_DOMAIN }}
   ```

3. **Alternative (if above doesn't work):**
   - Use backend service's generated domain URL
   - Format: `https://{service-name}.railway.app`

#### Connect Backend → MongoDB

**In Railway Dashboard:**

1. **Go to Backend Service**
   - Settings → Variables

2. **Add MongoDB Reference**
   ```
   MONGODB_URI = ${{ services.mongodb.MONGO_URL }}
   ```

3. **Or use explicit connection:**
   ```
   MONGODB_URI = mongodb+srv://admin:PASSWORD@host:port/railway
   ```

---

### STEP 9: Deploy Services

#### Deployment Order:

1. **MongoDB** (Database first)
   - Automatic with service creation
   - Status: Ready

2. **Backend** (API server)
   - Automatic deployment after railway.json detected
   - Builds from `Dockerfile.backend`
   - Waits for MongoDB to be ready

3. **Frontend** (Web interface)
   - Automatic deployment
   - Builds from `Dockerfile.frontend`
   - Requires backend URL for API calls

#### Monitor Deployment:

**In Railway Dashboard:**
1. Click on each service
2. Go to **"Deployments"** tab
3. Watch build progress
4. Check logs for errors

**Logs Location:**
- Dashboard → Service → **Logs** tab
- See real-time build output
- Check for any errors or warnings

#### Deployment Process:

```
1. GitHub Push → Railway detects change
2. Pulls latest code from main branch
3. Builds Docker image using Dockerfile
4. Tests container startup
5. Routes traffic to new deployment
6. Scales based on configuration
```

---

## Environment Variables Setup

### Summary Table

#### All Required Variables

| Service | Variable | Value | Required | Type |
|---------|----------|-------|----------|------|
| Backend | `TMDB_API_KEY` | API key from TMDB | ✅ Yes | Secret |
| Backend | `MONGODB_URI` | MongoDB connection string | ✅ Yes | Secret |
| Backend | `MONGODB_DB` | `culture_align` | ✅ Yes | String |
| Backend | `OLLAMA_BASE_URL` | `http://localhost:11434` | ❌ Optional | URL |
| Backend | `OLLAMA_MODEL` | `llama3` | ❌ Optional | String |
| Frontend | `NEXT_PUBLIC_API_URL` | Backend domain URL | ✅ Yes | String |
| Frontend | `NEXT_PUBLIC_ENVIRONMENT` | `production` | ❌ Optional | String |

### How to Set Variables in Railway:

#### Method 1: UI (Recommended)
```
Dashboard → Project → Service Name → Variables → Add Variable
Key: VARIABLE_NAME
Value: actual_value_here
Click Save
```

#### Method 2: .env File (Local Testing)
```
Location: backend/.env
TMDB_API_KEY=your_key
MONGODB_URI=your_connection_string
MONGODB_DB=culture_align
OLLAMA_BASE_URL=http://localhost:11434

Location: frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### Method 3: Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Set variable
railway variables set TMDB_API_KEY your_actual_key

# Deploy
railway deploy
```

---

## Docker Configuration Details

### Backend Docker - Deep Dive

**File:** `Dockerfile.backend`

```dockerfile
# Step 1: Choose base image - lightweight Python
FROM python:3.11-slim
# python:3.11-slim = 140MB
# vs python:3.11 = 1GB
# Reduced size for faster deployment

# Step 2: Set working directory in container
WORKDIR /app
# All commands run from /app directory
# Files copied to /app

# Step 3: Install system packages needed by Python
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*
# gcc = C compiler needed for:
# - numpy, pandas, cryptography (compiled extensions)
# - psutil, motor (MongoDB async driver)
# Cleanup /var/lib/apt/lists/* reduces image size

# Step 4: Copy requirements file
COPY backend/requirements.txt .
# Copies from your machine to /app/requirements.txt

# Step 5: Install Python packages
RUN pip install --no-cache-dir -r requirements.txt
# --no-cache-dir = Don't store pip cache (saves 40-100MB)
# Installs all dependencies from requirements.txt

# Step 6: Copy entire backend directory
COPY backend/ .
# Copies all code to /app/
# Structure: /app/main.py, /app/db/, /app/modules/, /app/routers/

# Step 7: Expose port for external access
EXPOSE 8000
# Makes port 8000 available
# Doesn't actually open it, just documents it

# Step 8: Start the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
# uvicorn = ASGI server for FastAPI
# main:app = main.py file, app FastAPI object
# --host 0.0.0.0 = Listen on all network interfaces
# --port 8000 = Use port 8000
```

### Frontend Docker - Deep Dive

**File:** `Dockerfile.frontend`

```dockerfile
# STAGE 1: Builder (Build Next.js app)
FROM node:18-alpine AS builder
# node:18-alpine = 164MB lightweight Node image
# AS builder = Name this stage for reference

WORKDIR /app
# Set /app as working directory

COPY frontend/package*.json ./
# package.json and package-lock.json (if exists)
# * wildcard = copy both if they exist

RUN npm ci
# npm ci = Clean install (better for Docker than npm install)
# Installs exact versions from package-lock.json
# Creates node_modules/

COPY frontend/ .
# Copy entire frontend code

RUN npm run build
# Runs "next build" from package.json
# Creates .next/ folder (optimized production bundle)

# STAGE 2: Production (Runtime environment)
FROM node:18-alpine
# Fresh Node.js environment (smaller final image)
# Doesn't include builder's source code

WORKDIR /app

COPY frontend/package*.json ./
# Copy dependencies list

RUN npm ci --only=production
# Only install production dependencies
# Excludes dev dependencies (saves ~200MB)

COPY --from=builder /app/.next ./.next
# Copy built Next.js app from builder stage
# .next = compiled/optimized production bundle

COPY --from=builder /app/public ./public
# Copy static assets (images, fonts, etc.)

EXPOSE 3000
# Make port 3000 available

CMD ["npm", "start"]
# Runs "npm start" which does:
# next start = Production Next.js server
# Serves .next/ folder
```

### Docker Build Process on Railway

When you push to GitHub:

1. **Detection Phase**
   ```
   Railway reads railway.json
   Finds builder: "dockerfile"
   Looks for Dockerfile.backend & Dockerfile.frontend
   ```

2. **Build Phase (Backend)**
   ```
   FROM python:3.11-slim              (Download base image)
   COPY backend/requirements.txt .    (File copy)
   RUN pip install ...                (Install packages) ← SLOW
   COPY backend/ .                    (Code copy)
   Total time: 3-5 minutes
   Image size: ~800MB
   ```

3. **Build Phase (Frontend)**
   ```
   FROM node:18-alpine                (Download base image)
   COPY frontend/package*.json ./     (File copy)
   RUN npm ci                         (Install packages) ← SLOW
   COPY frontend/ .                   (Code copy)
   RUN npm run build                  (Build Next.js) ← VERY SLOW
   FROM node:18-alpine                (Start new stage)
   COPY --from=builder ...            (Copy built files)
   Total time: 8-15 minutes
   Image size: ~250MB
   ```

4. **Push Phase**
   ```
   Push built images to Railway registry
   Configure environment variables
   Start containers
   Assign public URLs
   ```

5. **Running Phase**
   ```
   Backend container: Port 8000 → Railway Public Domain
   Frontend container: Port 3000 → Railway Public Domain
   MongoDB: Port 27017 → Internal Railway network
   ```

---

## Service Integration

### Network Communication

#### Backend ↔ MongoDB Communication

**Inside Docker Network (Railway Internal):**
```
Frontend Container (Port 3000)
    ↓ (API calls over HTTP)
Backend Container (Port 8000)
    ↓ (MongoDB calls over network)
MongoDB Container (Port 27017)
```

**Connection String Used by Backend:**
```python
# From environment variable MONGODB_URI
# Example:
mongodb+srv://admin:password@cluster-name.railway.internal:27017/railway
# OR
mongodb://admin:password@mongodb:27017/railway
# (Railway service name can be used instead of IP)
```

#### Frontend ↔ Backend Communication

**Outside Docker Network (Public HTTPS):**
```
User Browser (on internet)
    ↓ (HTTPS request)
Frontend (Public URL: https://frontend.railway.app)
    ↓ (JavaScript fetch/axios to API)
Backend (Public URL: https://backend.railway.app)
    ↓ (Internal request to MongoDB)
MongoDB (Internal Railway network)
```

**Frontend Configuration:**
```typescript
// frontend/lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL;
// Example: https://backend.railway.app

// Client makes requests:
fetch(`${API_BASE}/api/analyze`, { ... })
// Full URL: https://backend.railway.app/api/analyze
```

### CORS Configuration Needed

**In Backend (`backend/main.py`):**

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://frontend-service-url.railway.app",
        "http://localhost:3000"  # For local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Update in Railway:**
- Get frontend domain from Railway dashboard
- Update `allow_origins` with frontend URL
- Redeploy backend

---

## Post-Deployment Verification

### Step 1: Check Service Status

**In Railway Dashboard:**
```
Project → Each Service

Status indicators:
🟢 Green = Running
🟡 Yellow = Building
🔴 Red = Error
```

### Step 2: View Public URLs

**For Each Service:**
```
Dashboard → Service → Settings → Domain

Backend URL:  https://culture-alignment-backend.railway.app
Frontend URL: https://culture-alignment-frontend.railway.app
```

### Step 3: Test Backend API

**Method 1: Browser**
```
Go to: https://culture-alignment-backend.railway.app/docs
Should see: Swagger UI with all API endpoints
```

**Method 2: curl command**
```bash
curl https://culture-alignment-backend.railway.app/health
# or
curl -X POST https://culture-alignment-backend.railway.app/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"movie_title":"Inception"}'
```

### Step 4: Test Frontend

**Method: Browser**
```
Go to: https://culture-alignment-frontend.railway.app
Should see: CultureAlign web interface
Try searching for a movie
Should make successful API call to backend
```

### Step 5: Check Logs for Errors

**For Backend:**
```
Dashboard → backend → Logs

Watch for:
- "Uvicorn running on 0.0.0.0:8000"
- No error messages
- Successful MongoDB connections
```

**For Frontend:**
```
Dashboard → frontend → Logs

Watch for:
- "ready - started server on"
- No build errors
- Successful API connections
```

### Step 6: Monitor Database

**MongoDB Status:**
```
Dashboard → MongoDB service → Metrics

Check:
- Disk usage
- Connections
- Operations/sec
```

---

## Troubleshooting

### Common Issues & Solutions

#### Issue 1: Backend Service Won't Start

**Error in Logs:**
```
ModuleNotFoundError: No module named 'fastapi'
```

**Solution:**
1. Check `requirements.txt` exists at `backend/requirements.txt`
2. Check `Dockerfile.backend` path: `COPY backend/requirements.txt .`
3. Verify pip install command: `RUN pip install --no-cache-dir -r requirements.txt`
4. Redeploy: Force rebuild with `railway up`

**Reference File:**
```
Location: backend/requirements.txt

Must include:
fastapi==0.135.3
uvicorn==0.44.0
pymongo==4.16.0
```

---

#### Issue 2: Frontend Can't Connect to Backend

**Error in Browser Console:**
```
CORS error: Access-Control-Allow-Origin missing
```

**Solution:**
1. Get backend URL from Railway dashboard
2. Update frontend CORS in `backend/main.py`
3. Set `NEXT_PUBLIC_API_URL` environment variable in frontend service
4. Redeploy backend first, then frontend

**Reference Files:**
```
backend/main.py
- Add CORSMiddleware with frontend URL

frontend/lib/api.ts
- Check API_BASE uses process.env.NEXT_PUBLIC_API_URL

frontend/next.config.mjs
- May need rewrites for API calls
```

---

#### Issue 3: MongoDB Connection Failed

**Error in Logs:**
```
MongoServerError: connection refused
MongoAuthenticationError: auth failed
```

**Solution:**
1. Check MongoDB service is running (green status)
2. Verify `MONGODB_URI` environment variable
3. Check MongoDB credentials are correct
4. Ensure backend service can access MongoDB service
5. Try test connection:

```python
# Add temporary test endpoint in backend/main.py
@app.get("/test/db")
async def test_db():
    client = AsyncClient(os.getenv("MONGODB_URI"))
    try:
        await client.admin.command('ping')
        return {"status": "Connected"}
    except Exception as e:
        return {"status": "Failed", "error": str(e)}
```

**Reference Files:**
```
backend/db/connection.py
- Where MongoDB connection is initialized

backend/config.py
- Where MONGODB_URI is loaded from environment
```

---

#### Issue 4: Build Timeout

**Error:**
```
Build exceeded time limit
npm run build took too long
```

**Solution:**
1. Increase build timeout in Railway settings (if available)
2. Optimize Next.js build:
   - Remove unused dependencies
   - Enable SWC minification
   - Use dynamic imports

```javascript
// frontend/next.config.mjs
export default {
  swcMinify: true,
  compress: true,
  productionBrowserSourceMaps: false,
}
```

---

#### Issue 5: Environment Variables Not Found

**Error:**
```
KeyError: 'TMDB_API_KEY'
EnvironmentError: Required variable not set
```

**Solution:**
1. Go to service → Variables in Railway
2. Add each required variable
3. Check for typos in variable names (case-sensitive)
4. Redeploy service

**Checklist:**
```
Backend required variables:
✓ TMDB_API_KEY
✓ MONGODB_URI
✓ MONGODB_DB

Frontend required variables:
✓ NEXT_PUBLIC_API_URL
```

---

#### Issue 6: Port Already in Use

**Error:**
```
Port 8000 already in use
Port 3000 already in use
```

**Solution:**
Railway automatically assigns ports, so this shouldn't happen in production.
For local testing:
```bash
# Kill process using port
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

---

### Health Check Endpoints

**Backend Health Check:**
```bash
curl https://your-backend-url.railway.app/health
# Should return 200 OK
```

**Add health endpoint to backend:**
```python
# backend/main.py
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "2.0"}
```

---

### Performance Optimization

#### Backend Optimization:

```python
# backend/config.py
class Settings:
    # Connection pooling
    mongo_connection_pool_size = 10
    # Caching
    cache_ttl = 3600  # 1 hour
    # Timeout
    request_timeout = 30
```

#### Frontend Optimization:

```javascript
// frontend/next.config.mjs
export default {
  compress: true,
  minify: true,
  productionBrowserSourceMaps: false,
  experimental: {
    optimizePackageImports: ["@/components"]
  }
}
```

---

## Deployment Checklist

Before deploying, verify all items:

### Code Ready
- [ ] All code committed to GitHub
- [ ] Latest version on `main` branch
- [ ] No syntax errors
- [ ] `.gitignore` excludes `node_modules/`, `__pycache__/`, `.env`

### Docker Files Ready
- [ ] `Dockerfile.backend` exists and correct
- [ ] `Dockerfile.frontend` exists and correct
- [ ] `railway.json` configured
- [ ] Path references match your structure

### Credentials Ready
- [ ] TMDB API key obtained
- [ ] API keys not committed to GitHub
- [ ] Ready to add to environment variables

### Infrastructure Ready
- [ ] Railway account created
- [ ] Billing configured
- [ ] MongoDB chosen and ready

### Configuration Ready
- [ ] `backend/requirements.txt` complete
- [ ] `frontend/package.json` complete
- [ ] Environment variables listed
- [ ] CORS settings planned

### Testing Ready
- [ ] Local backend works: `uvicorn main:app --reload`
- [ ] Local frontend works: `npm run dev`
- [ ] API endpoints tested locally
- [ ] MongoDB connection tested locally

### Post-Deploy Ready
- [ ] Know where to find logs
- [ ] Know where to find metrics
- [ ] Have curl/Postman ready for testing
- [ ] Have browser DevTools ready for frontend testing

---

## Quick Reference Commands

### Local Testing Before Deploy

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run build
npm start

# MongoDB (locally)
mongod
```

### Railway CLI Commands

```bash
# Install
npm install -g @railway/cli

# Login
railway login

# Navigate to project
railway link

# Set environment variables
railway variables set TMDB_API_KEY your_key

# Deploy
railway up

# View logs
railway logs -f

# View environment
railway variables show

# Run locally with Railway environment
railway run npm start
```

---

## Support & Resources

### Documentation
- Railway Docs: https://docs.railway.app
- FastAPI Docs: https://fastapi.tiangolo.com
- Next.js Docs: https://nextjs.org/docs
- MongoDB Docs: https://docs.mongodb.com

### Community
- Railway Discord: https://discord.gg/railway
- FastAPI Discord: https://discord.gg/VQjSR6t
- Next.js Discord: https://discord.gg/nextjs

### Monitoring
- Railway Dashboard: https://railway.app/dashboard
- View logs: Service → Logs
- View metrics: Service → Metrics
- View deployments: Service → Deployments

---

## Final Notes

### Project-Specific Details

**Your Project Structure:**
```
c:\Users\msoor\Desktop\entertainment_tech\culture-alignment\
├── Dockerfile.backend
├── Dockerfile.frontend
├── railway.json
├── backend/
│   ├── main.py (FastAPI app)
│   ├── requirements.txt (Python dependencies)
│   ├── config.py (Settings)
│   └── db/connection.py (MongoDB connection)
├── frontend/
│   ├── package.json (Node dependencies)
│   ├── next.config.mjs (Next.js config)
│   └── app/page.tsx (Main page)
```

### Services to Deploy
1. **Backend** - FastAPI server on port 8000
2. **Frontend** - Next.js app on port 3000
3. **MongoDB** - Database (Railway managed)

### Estimated Deployment Time
- First deployment: 15-25 minutes (builds from scratch)
- Subsequent deployments: 5-10 minutes (uses cache)
- Frontend build alone: 5-10 minutes
- Backend build alone: 2-5 minutes

### Estimated Monthly Cost (Free Tier)
- Backend: Free (included)
- Frontend: Free (included)
- MongoDB: Free (5GB storage)
- Total: $0/month for free tier

---

**Document Version:** 1.0  
**Last Updated:** April 22, 2026  
**Project:** CultureAlign  
**Status:** Ready for Deployment
