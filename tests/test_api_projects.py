"""Tests for Project API endpoints"""
import json

class TestProjectAPI:
    """Project API tests"""

    def test_create_project(self, client):
        """Test creating a migration project"""
        payload = {
            'organization_id': 'org-001',
            'name': 'AWS Migration Project',
            'target_cloud': 'aws',
            'migration_type': 'lift-shift',
            'expected_duration_months': 6,
            'budget': 100000,
        }
        response = client.post('/api/v1/projects', json=payload,
                               content_type='application/json')
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['name'] == 'AWS Migration Project'
        assert data['target_cloud'] == 'aws'

    def test_get_project(self, client, sample_project):
        """Test retrieving a project"""
        response = client.get(f'/api/v1/projects/{sample_project.id}')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['id'] == sample_project.id
        assert data['name'] == 'Test Project'

    def test_update_project(self, client, sample_project):
        """Test updating a project"""
        payload = {'status': 'in-progress', 'progress_percentage': 25, 'budget': 150000}
        response = client.put(f'/api/v1/projects/{sample_project.id}',
                              json=payload, content_type='application/json')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'in-progress'
        assert data['progress_percentage'] == 25

    def test_create_wave(self, client, sample_project):
        """Test creating a migration wave"""
        payload = {
            'wave_number': 1,
            'name': 'Wave 1: Quick Wins',
            'description': 'Non-critical applications',
            'applications_count': 5,
        }
        response = client.post(f'/api/v1/projects/{sample_project.id}/waves',
                               json=payload, content_type='application/json')
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['wave_number'] == 1
