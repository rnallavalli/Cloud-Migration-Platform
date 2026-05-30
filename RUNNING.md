# Running the Cloud Migration Platform

## Prerequisites
- **Docker Desktop** ≥ 24 ([download](https://www.docker.com/products/docker-desktop))
- **Git**
- Ports **80**, **3000**, **5000**, **5432** free on your machine

---

## Option 1 — Docker Compose (Recommended, one command)

```bash
# 1. Clone the repository
git clone https://github.com/rnallavalli/Cloud-Migration-Platform.git
cd Cloud-Migration-Platform

# 2. Start everything (database + API + UI)
docker-compose up --build

# 3. Open in browser
open http://localhost:3000     # React UI
open http://localhost:5000/api/v1/health  # API health check
```

Services started:
| Service  | URL                        | Description          |
|----------|----------------------------|----------------------|
| UI       | http://localhost:3000       | React dashboard      |
| API      | http://localhost:5000       | Flask REST API       |
| Postgres | localhost:5432              | Database             |
| Redis    | localhost:6379              | Cache                |

**Stop everything:**
```bash
docker-compose down           # stop containers
docker-compose down -v        # stop + delete database volume
```

---

## Option 2 — Run locally (without Docker)

### Backend (Flask API)

```bash
# 1. Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start PostgreSQL (via Docker — just the DB)
docker run -d \
  --name cmp-postgres \
  -e POSTGRES_USER=cmp_user \
  -e POSTGRES_PASSWORD=cmp_password \
  -e POSTGRES_DB=cloud_migration_db \
  -p 5432:5432 \
  postgres:15-alpine

# 4. Set environment variables
export FLASK_APP=src/api/app.py
export FLASK_ENV=development
export DATABASE_URL=postgresql://cmp_user:cmp_password@localhost:5432/cloud_migration_db

# 5. Run the API
flask run --host=0.0.0.0 --port=5000
# API available at http://localhost:5000
```

### Frontend (React UI)

```bash
# In a new terminal, from the project root:
cd src/web

npm install
npm run dev
# UI available at http://localhost:3000
```

---

## Option 3 — Run tests

```bash
# Activate virtualenv first
source venv/bin/activate

# Run all tests with coverage
pytest tests/ -v --cov=src --cov-report=term-missing

# Run specific test files
pytest tests/test_api_assessments.py -v
pytest tests/test_assessment_engine.py -v
pytest tests/test_migration_engine.py -v
```

---

## API Quick Reference

| Method | Endpoint                                      | Description                    |
|--------|-----------------------------------------------|--------------------------------|
| GET    | `/api/v1/health`                              | Health check                   |
| POST   | `/api/v1/assessments`                         | Create assessment               |
| GET    | `/api/v1/assessments/{id}`                    | Get assessment details          |
| PUT    | `/api/v1/assessments/{id}`                    | Update scores & status          |
| GET    | `/api/v1/assessments/organization/{org_id}`   | List org assessments            |
| POST   | `/api/v1/projects`                            | Create migration project        |
| GET    | `/api/v1/projects/{id}`                       | Get project details             |
| POST   | `/api/v1/projects/{id}/waves`                 | Add migration wave              |
| POST   | `/api/v1/projects/{id}/applications`          | Add application                 |
| GET    | `/api/v1/recommendations/assessment/{id}`     | Get arch recommendations        |
| POST   | `/api/v1/recommendations`                     | Create recommendation           |

---

## UI Feature Walkthrough

1. **Dashboard** — KPI cards, radar chart (readiness scores), project progress bars, recent activity lists

2. **Assessments** → **New Assessment** → fill name/scope/type → **Run Assessment** button opens a 4-step wizard:
   - Step 1: Business Readiness (executive sponsor, budget, objectives…)
   - Step 2: Technical Readiness (architecture type, integrations, data size…)
   - Step 3: Organizational Readiness (skills, training, governance…)
   - Step 4: Security & Compliance (policies, encryption, audit logging…)
   - Scores are calculated and saved; architecture recommendations auto-generated

3. **Projects** → **New Project** → set target cloud (AWS/Azure/GCP), strategy, budget → **Add Wave** → **Add App**

4. **Recommendations** — select a completed assessment to view ranked architecture options with pros/cons and suitability scores

---

## Environment Variables

| Variable       | Default                                                        | Description      |
|----------------|----------------------------------------------------------------|------------------|
| `DATABASE_URL` | `postgresql://cmp_user:cmp_password@localhost:5432/cloud_migration_db` | Postgres URL |
| `FLASK_ENV`    | `development`                                                  | Flask environment |
| `REDIS_URL`    | `redis://redis:6379/0`                                         | Redis URL         |
| `VITE_API_URL` | `http://localhost:5000/api/v1`                                 | API base URL (UI) |
