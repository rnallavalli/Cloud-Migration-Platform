"""Pytest configuration and fixtures"""
import pytest
from src.api import create_app, db
from src.api.models import Assessment, MigrationProject, Application

@pytest.fixture
def app():
    """Create application for testing"""
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """Test client"""
    return app.test_client()

@pytest.fixture
def runner(app):
    """Test CLI runner"""
    return app.test_cli_runner()

@pytest.fixture
def sample_assessment(app):
    """Create sample assessment for testing"""
    with app.app_context():
        assessment = Assessment(
            id='assess-test-001',
            organization_id='org-001',
            name='Test Assessment',
            scope='full-infrastructure',
            assessment_type='cloud-readiness',
            status='created'
        )
        db.session.add(assessment)
        db.session.commit()
        return assessment

@pytest.fixture
def sample_project(app):
    """Create sample project for testing"""
    with app.app_context():
        project = MigrationProject(
            id='proj-test-001',
            organization_id='org-001',
            name='Test Project',
            target_cloud='aws',
            migration_type='lift-shift',
            status='planning'
        )
        db.session.add(project)
        db.session.commit()
        return project
