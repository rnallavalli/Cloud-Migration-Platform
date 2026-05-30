# Cloud Migration Platform API Documentation

## Base URL
```
https://api.cloudmigrationplatform.com/v1
```

## Authentication
All API requests require authentication using Bearer tokens:
```
Authorization: Bearer <your-api-token>
```

## Assessment Endpoints

### Create Assessment
```
POST /assessments
```

**Request:**
```json
{
  "organization_id": "org-123",
  "name": "Q2 2026 Migration Assessment",
  "scope": "full-infrastructure",
  "assessment_type": "cloud-readiness"
}
```

**Response:**
```json
{
  "id": "assess-456",
  "status": "created",
  "created_at": "2026-05-30T10:00:00Z"
}
```

### Get Assessment Results
```
GET /assessments/{assessment_id}
```

**Response:**
```json
{
  "id": "assess-456",
  "organization_id": "org-123",
  "status": "completed",
  "scores": {
    "business_readiness": 75,
    "technical_readiness": 68,
    "organizational_readiness": 82,
    "security_compliance": 71,
    "overall_score": 74
  },
  "recommendations": [
    {
      "category": "training",
      "priority": "high",
      "description": "Conduct cloud architecture training"
    }
  ]
}
```

## Migration Project Endpoints

### Create Migration Project
```
POST /projects
```

**Request:**
```json
{
  "name": "Mainframe to Cloud Migration",
  "organization_id": "org-123",
  "target_cloud": "aws",
  "expected_duration_months": 12,
  "budget": 500000
}
```

**Response:**
```json
{
  "id": "proj-789",
  "status": "planning",
  "created_at": "2026-05-30T10:00:00Z"
}
```

### Get Project Details
```
GET /projects/{project_id}
```

**Response:**
```json
{
  "id": "proj-789",
  "name": "Mainframe to Cloud Migration",
  "status": "in-progress",
  "progress": 45,
  "waves": [
    {
      "wave_number": 1,
      "status": "completed",
      "applications_count": 15,
      "completion_date": "2026-06-30"
    }
  ]
}
```

## Architecture Recommendation Endpoints

### Get Architecture Recommendations
```
GET /recommendations/{assessment_id}
```

**Response:**
```json
{
  "assessment_id": "assess-456",
  "recommendations": [
    {
      "architecture": "microservices",
      "platform": "kubernetes",
      "suitability_score": 92,
      "justification": "High scalability and containerization benefits"
    }
  ]
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "invalid_request",
  "message": "Missing required field: organization_id"
}
```

### 401 Unauthorized
```json
{
  "error": "unauthorized",
  "message": "Invalid API token"
}
```

### 404 Not Found
```json
{
  "error": "not_found",
  "message": "Assessment not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "internal_error",
  "message": "An error occurred processing your request"
}
```

## Rate Limiting

- Limit: 1000 requests per hour per API key
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Webhooks

Subscribe to events:
```
POST /webhooks
```

**Events:**
- `assessment.completed`
- `project.updated`
- `migration.wave_completed`