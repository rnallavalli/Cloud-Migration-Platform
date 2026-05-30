"""Assessment API routes"""
from flask import Blueprint, request, jsonify
from src.api import db
from src.api.models import Assessment
from src.api.utils import generate_id
import json
from datetime import datetime

assessment_bp = Blueprint('assessments', __name__, url_prefix='/api/v1/assessments')

@assessment_bp.route('', methods=['POST'])
def create_assessment():
    """Create a new assessment"""
    try:
        data = request.get_json()

        required_fields = ['organization_id', 'name', 'scope', 'assessment_type']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400

        assessment = Assessment(
            id=generate_id('assess'),
            organization_id=data['organization_id'],
            name=data['name'],
            description=data.get('description', ''),
            scope=data['scope'],
            assessment_type=data['assessment_type'],
            status='created'
        )

        db.session.add(assessment)
        db.session.commit()

        return jsonify(assessment.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@assessment_bp.route('/<assessment_id>', methods=['GET'])
def get_assessment(assessment_id):
    """Get assessment details"""
    try:
        assessment = Assessment.query.get(assessment_id)
        if not assessment:
            return jsonify({'error': 'Assessment not found'}), 404
        return jsonify(assessment.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@assessment_bp.route('/<assessment_id>', methods=['PUT'])
def update_assessment(assessment_id):
    """Update assessment"""
    try:
        assessment = Assessment.query.get(assessment_id)
        if not assessment:
            return jsonify({'error': 'Assessment not found'}), 404

        data = request.get_json()

        if 'status' in data:
            assessment.status = data['status']
        if 'business_readiness_score' in data:
            assessment.business_readiness_score = data['business_readiness_score']
        if 'technical_readiness_score' in data:
            assessment.technical_readiness_score = data['technical_readiness_score']
        if 'organizational_readiness_score' in data:
            assessment.organizational_readiness_score = data['organizational_readiness_score']
        if 'security_compliance_score' in data:
            assessment.security_compliance_score = data['security_compliance_score']

        # Calculate overall score
        scores = [
            assessment.business_readiness_score,
            assessment.technical_readiness_score,
            assessment.organizational_readiness_score,
            assessment.security_compliance_score,
        ]
        if all(scores):
            assessment.overall_score = int(sum(scores) / 4)
            if data.get('status') == 'completed':
                assessment.completed_at = datetime.utcnow()

        if 'recommendations' in data:
            assessment.recommendations = json.dumps(data['recommendations'])
        if 'risks' in data:
            assessment.risks = json.dumps(data['risks'])

        assessment.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify(assessment.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@assessment_bp.route('/organization/<org_id>', methods=['GET'])
def get_assessments_by_org(org_id):
    """Get all assessments for an organization"""
    try:
        assessments = Assessment.query.filter_by(organization_id=org_id).all()
        return jsonify([a.to_dict() for a in assessments]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
