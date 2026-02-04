# ML Server - Gower Distance

## 🎯 Overview

**Algorithm:** Gower Distance (mixed data types)  
**Version:** 9.0.0  
**Port:** 8001 (to avoid conflict with ml_server on 8000)  
**Weights:** Subject 34.7%, Grade 35.2%, Days 20%, Times 10.1%

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Build image
docker build -t ml-server-gower .

# Run container
docker run -d \
  --name ml-server-gower \
  -p 8001:8001 \
  -e BACKEND_URL=http://host.docker.internal:8888 \
  ml-server-gower

# Check logs
docker logs -f ml-server-gower

# Stop container
docker stop ml-server-gower
docker rm ml-server-gower
```

### Option 2: Local Python

```bash
# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# Or use Python module syntax
python -m uvicorn app.main:app --port 8001 --reload
```

---

## 🧪 Testing

```bash
# Run test suite
python test_gower.py

# Test API endpoint
curl http://localhost:8001/

# Test matching endpoint
curl -X POST http://localhost:8001/match \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Student",
    "email": "test@example.com",
    "tag_subject": "Mathematics",
    "grade": "11",
    "tag_study_days": ["Monday", "Wednesday"],
    "tag_study_times": ["Morning (6am-12pm)"]
  }'
```

---

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API status and configuration |
| `/match` | POST | Find study buddies (Gower distance) |
| `/features` | GET | Feature encoding information |
| `/stats` | GET | User distribution statistics |
| `/weights` | GET | Survey-based weights explanation |

**Swagger Docs:** http://localhost:8001/docs

---

## 🔄 Running Both Servers

You can run both ml_server (old) and ml_server_gower (new) simultaneously:

```bash
# Terminal 1 - Old server (Weighted K-Means or Jaccard)
cd ml_server
docker run -p 8000:8000 ml-server:latest

# Terminal 2 - New server (Gower Distance)
cd ml_server_gower
docker run -p 8001:8001 ml-server-gower

# Or use docker-compose (see root docker-compose.yml)
docker-compose up ml_server ml_server_gower
```

**Backend integration:** Update `ML_SERVER_URL` env variable to switch:
- Old: `http://localhost:8000`
- New: `http://localhost:8001`

---

## 📁 Project Structure

```
ml_server_gower/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app (Gower implementation)
│   ├── gower_matching.py    # Gower distance algorithm
│   └── schemas.py           # Pydantic models
├── Dockerfile               # Docker configuration
├── requirements.txt         # Python dependencies
├── test_gower.py           # Test suite
├── GOWER_IMPLEMENTATION.md # Technical documentation
└── README.md               # This file
```

---

## 🆚 Comparison with ml_server

| Feature | ml_server | ml_server_gower |
|---------|-----------|-----------------|
| **Algorithm** | Weighted K-Means or K-Means+Jaccard | Gower Distance |
| **Port** | 8000 | 8001 |
| **Grade Handling** | Binary/Ordinal (arbitrary) | Ordinal (normalized) ✅ |
| **Mixed Data** | Euclidean (not ideal) | Native support ✅ |
| **Weights** | 50-35-15 or 70-30 | 34.7-35.2-20-10.1 ✅ |
| **Academic Defense** | Medium | High ✅ |

---

## 📝 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKEND_URL` | `http://host.docker.internal:8888` | Backend API URL for fetching users |
| `PORT` | `8001` | Server port |

---

## 🐛 Troubleshooting

**Port already in use:**
```bash
# Find process on port 8001
netstat -ano | findstr :8001

# Kill process (Windows)
taskkill /PID <PID> /F
```

**Docker issues:**
```bash
# Rebuild without cache
docker build --no-cache -t ml-server-gower .

# Remove old containers
docker container prune
```

**Import errors:**
```bash
# Verify Python path
echo $PYTHONPATH

# Run from project root
cd ml_server_gower
python -m pytest test_gower.py
```

---

## 📚 Documentation

- **Technical Docs:** [GOWER_IMPLEMENTATION.md](./GOWER_IMPLEMENTATION.md)
- **API Docs:** http://localhost:8001/docs (Swagger UI)
- **Academic Reference:** Gower, J. C. (1971). Biometrics, 27(4), 857-871.

---

**Last Updated:** 2026-01-17  
**Status:** ✅ Production Ready
