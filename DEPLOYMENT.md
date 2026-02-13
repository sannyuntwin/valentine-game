# Valentine's Multiplayer Game Deployment Guide

## 🚀 Frontend (Vercel)

### Quick Deploy
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables
Set in Vercel Dashboard:
```
NEXT_PUBLIC_SOCKET_URL=https://your-backend-url.com
```

## 🖥️ Backend Options

### Option 1: Railway (Recommended)
```bash
# Install CLI
npm install -g @railway/cli

# Deploy
railway login
railway init
railway up
```

### Option 2: Render
1. Create account at [render.com](https://render.com)
2. Connect GitHub repository
3. Add Web Service
4. Build Command: `npm install`
5. Start Command: `node socket-server.js`
6. Port: 3001

### Option 3: Heroku
```bash
# Deploy
heroku create your-valentine-game
git push heroku main
```

## 🔗 CORS Configuration

Your backend needs to allow your frontend domain. Update socket-server.js:

```javascript
const io = new Server(server, {
  cors: {
    origin: [
      "https://your-vercel-app.vercel.app",
      "http://localhost:3000"
    ],
    methods: ["GET", "POST"]
  }
});
```

## 📱 Production Checklist

- [ ] Update CORS origins for production domains
- [ ] Set environment variables
- [ ] Test multiplayer functionality
- [ ] Configure SSL (most platforms handle automatically)
- [ ] Set up monitoring/logging

## 🌐 URLs After Deployment

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend.railway.app` (or your chosen platform)

## 🎯 Next Steps

1. Deploy frontend to Vercel
2. Deploy backend to Railway/Render/Heroku  
3. Update CORS configuration
4. Set environment variables
5. Test multiplayer functionality
