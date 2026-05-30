"""Migration Project API routes"""
from flask import Blueprint, request, jsonify
from src.api import db
from src.api.models import MigrationProject, MigrationWave, Application
from src.api.utils import generate_id
from datetime import datetime

project_bp = Blueprint('projects', __name__, url_prefix='/api/v1/projects')

@project_bp.route('', methods=['POST'])
def create_project():
    """Create a new migration project"""
    try:
        data = request.get_json()

        required_fields = ['organization_id', 'name', 'target_cloud']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400

        project = MigrationProject(
            id=generate_id('proj'),
            organization_id=data['organization_id'],
            assessment_id=data.get('assessment_id'),
            name=data['name'],
            description=data.get('description', ''),
            target_cloud=data['target_cloud'],
            migration_type=data.get('migration_type', 'lift-shift'),
            expected_duration_months=data.get('expected_duration_months'),
            budget=data.get('budget')
        )

        db.session.add(project)
        db.session.commit()

        return jsonify(project.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@project_bp.route('/<project_id>', methods=['GET'])
def get_project(project_id):
    """Get project details"""
    try:
        project = MigrationProject.query.get(project_id)
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        return jsonify(project.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@project_bp.route('/<project_id>', methods=['PUT'])
def update_project(project_id):
    """Update project"""
    try:
        project = MigrationProject.query.get(project_id)
        if not project:
            return jsonify({'error': 'Project not found'}), 404

        data = request.get_json()

        if 'status' in data:
            project.status = data['status']
        if 'progress_percentage' in data:
            project.progress_percentage = data['progress_percentage']
        if 'budget' in data:
            project.budget = data['budget']

        project.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify(project.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@project_bp.route('/<project_id>/waves', methods=['POST'])
def create_wave(project_id):
    """Create a migration wave"""
    try:
        project = MigrationProject.query.get(project_id)
        if not project:
            return jsonify({'error': 'Project not found'}), 404

        data = request.get_json()

        wave = MigrationWave(
            id=generate_id('wave'),
            project_id=project_id,
            wave_number=data.get('wave_number'),
            name=data.get('name'),
            description=data.get('description'),
            status='planned',
            applications_count=data.get('applications_count', 0),
            data_size_gb=data.get('data_size_gb')
        )

        db.session.add(wave)
        db.session.commit()

        return jsonify(wave.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@project_bp.route('/<project_id>/applications', methods=['POST'])
def add_application(project_id):
    """Add application to project"""
    try:
        project = MigrationProject.query.get(project_id)
        if not project:
            return jsonify({'error': 'Project not found'}), 404

        data = request.get_json()

        app = Application(
            id=generate_id('app'),
            project_id=project_id,
            wave_id=data.get('wave_id'),
            name=data.get('name'),
            description=data.get('description'),
            current_platform=data.get('current_platform'),
            target_platform=data.get('target_platform'),
            complexity_level=data.get('complexity_level', 'medium'),
            criticality=data.get('criticality', 'medium')
        )

        db.session.add(app)
        db.session.commit()

        return jsonify(app.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@project_bp.route('/organization/<org_id>', methods=['GET'])
def get_projects_by_org(org_id):
    """Get all projects for an organization"""
    try:
        projects = MigrationProject.query.filter_by(organization_id=org_id).all()
        return jsonify([p.to_dict() for p in projects]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
