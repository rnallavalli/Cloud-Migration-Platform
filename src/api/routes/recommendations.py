"""Architecture Recommendation API routes"""
from flask import Blueprint, request, jsonify
from src.api import db
from src.api.models import ArchitectureRecommendation, Assessment
from src.api.utils import generate_id
import json

recommendation_bp = Blueprint('recommendations', __name__, url_prefix='/api/v1/recommendations')

@recommendation_bp.route('/assessment/<assessment_id>', methods=['GET'])
def get_recommendations(assessment_id):
    """Get architecture recommendations for an assessment"""
    try:
        assessment = Assessment.query.get(assessment_id)
        if not assessment:
            return jsonify({'error': 'Assessment not found'}), 404

        recommendations = ArchitectureRecommendation.query.filter_by(
            assessment_id=assessment_id
        ).order_by(ArchitectureRecommendation.suitability_score.desc()).all()

        return jsonify({
            'assessment_id': assessment_id,
            'recommendations': [r.to_dict() for r in recommendations]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@recommendation_bp.route('', methods=['POST'])
def create_recommendation():
    """Create architecture recommendation"""
    try:
        data = request.get_json()

        required_fields = ['assessment_id', 'architecture_type', 'target_platform']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400

        recommendation = ArchitectureRecommendation(
            id=generate_id('rec'),
            assessment_id=data['assessment_id'],
            architecture_type=data['architecture_type'],
            target_platform=data['target_platform'],
            suitability_score=data.get('suitability_score', 0),
            justification=data.get('justification', ''),
            pros=json.dumps(data.get('pros', [])),
            cons=json.dumps(data.get('cons', [])),
            cost_estimate=data.get('cost_estimate'),
            implementation_effort_weeks=data.get('implementation_effort_weeks')
        )

        db.session.add(recommendation)
        db.session.commit()

        return jsonify(recommendation.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
