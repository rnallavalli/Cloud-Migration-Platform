"""Tests for Assessment API endpoints"""
import json

class TestAssessmentAPI:
    """Assessment API tests"""

    def test_create_assessment(self, client):
        """Test creating an assessment"""
        payload = {
            'organization_id': 'org-001',
            'name': 'Cloud Readiness Assessment',
            'scope': 'full-infrastructure',
            'assessment_type': 'cloud-readiness',
        }
        response = client.post('/api/v1/assessments', json=payload,
                               content_type='application/json')
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['name'] == 'Cloud Readiness Assessment'
        assert data['status'] == 'created'

    def test_create_assessment_missing_fields(self, client):
        """Test creating assessment with missing fields"""
        payload = {'organization_id': 'org-001', 'name': 'Test Assessment'}
        response = client.post('/api/v1/assessments', json=payload,
                               content_type='application/json')
        assert response.status_code == 400

    def test_get_assessment(self, client, sample_assessment):
        """Test retrieving an assessment"""
        response = client.get(f'/api/v1/assessments/{sample_assessment.id}')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['id'] == sample_assessment.id
        assert data['name'] == 'Test Assessment'

    def test_get_nonexistent_assessment(self, client):
        """Test retrieving non-existent assessment"""
        response = client.get('/api/v1/assessments/assess-nonexistent')
        assert response.status_code == 404

    def test_update_assessment(self, client, sample_assessment):
        """Test updating an assessment"""
        payload = {
            'status': 'completed',
            'business_readiness_score': 75,
            'technical_readiness_score': 68,
            'organizational_readiness_score': 82,
            'security_compliance_score': 71,
        }
        response = client.put(f'/api/v1/assessments/{sample_assessment.id}',
                              json=payload, content_type='application/json')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'completed'
        assert data['scores']['overall_score'] == 74
