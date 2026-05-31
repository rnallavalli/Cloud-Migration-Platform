"""API Routes Module"""
from .health import health_bp
from .assessments import assessment_bp
from .projects import project_bp
from .recommendations import recommendation_bp
from .planner import planner_bp

__all__ = ['health_bp', 'assessment_bp', 'project_bp', 'recommendation_bp', 'planner_bp']
