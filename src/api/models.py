"""Database Models for Cloud Migration Platform"""
from src.api import db
from datetime import datetime
import json

class Assessment(db.Model):
    """Assessment model for cloud readiness evaluation"""
    __tablename__ = 'assessments'

    id = db.Column(db.String(50), primary_key=True)
    organization_id = db.Column(db.String(50), nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    scope = db.Column(db.String(100), nullable=False)  # full-infrastructure, partial, application
    assessment_type = db.Column(db.String(100), nullable=False)  # cloud-readiness, migration-readiness
    status = db.Column(db.String(50), default='created')  # created, in-progress, completed, failed

    # Scores (0-100)
    business_readiness_score = db.Column(db.Integer)
    technical_readiness_score = db.Column(db.Integer)
    organizational_readiness_score = db.Column(db.Integer)
    security_compliance_score = db.Column(db.Integer)
    overall_score = db.Column(db.Integer)

    # Assessment data
    assessment_data = db.Column(db.Text)  # JSON
    recommendations = db.Column(db.Text)  # JSON
    risks = db.Column(db.Text)  # JSON

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = db.Column(db.DateTime)

    # Relationships
    projects = db.relationship('MigrationProject', backref='assessment', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'organization_id': self.organization_id,
            'name': self.name,
            'description': self.description,
            'scope': self.scope,
            'assessment_type': self.assessment_type,
            'status': self.status,
            'scores': {
                'business_readiness': self.business_readiness_score,
                'technical_readiness': self.technical_readiness_score,
                'organizational_readiness': self.organizational_readiness_score,
                'security_compliance': self.security_compliance_score,
                'overall_score': self.overall_score
            },
            'recommendations': json.loads(self.recommendations) if self.recommendations else [],
            'risks': json.loads(self.risks) if self.risks else [],
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

class MigrationProject(db.Model):
    """Migration project model"""
    __tablename__ = 'migration_projects'

    id = db.Column(db.String(50), primary_key=True)
    assessment_id = db.Column(db.String(50), db.ForeignKey('assessments.id'), nullable=True)
    organization_id = db.Column(db.String(50), nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    target_cloud = db.Column(db.String(50), nullable=False)  # aws, azure, gcp, private, multi
    migration_type = db.Column(db.String(100), nullable=False)  # lift-shift, replatform, refactor, etc.
    status = db.Column(db.String(50), default='planning')  # planning, in-progress, completed, on-hold

    # Project details
    expected_duration_months = db.Column(db.Integer)
    budget = db.Column(db.Float)
    progress_percentage = db.Column(db.Integer, default=0)

    # Dates
    start_date = db.Column(db.DateTime)
    planned_completion_date = db.Column(db.DateTime)
    actual_completion_date = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    waves = db.relationship('MigrationWave', backref='project', lazy=True, cascade='all, delete-orphan')
    applications = db.relationship('Application', backref='project', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'assessment_id': self.assessment_id,
            'organization_id': self.organization_id,
            'name': self.name,
            'description': self.description,
            'target_cloud': self.target_cloud,
            'migration_type': self.migration_type,
            'status': self.status,
            'expected_duration_months': self.expected_duration_months,
            'budget': self.budget,
            'progress_percentage': self.progress_percentage,
            'waves': [w.to_dict() for w in self.waves],
            'applications_count': len(self.applications),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class MigrationWave(db.Model):
    """Migration wave model for phased migration"""
    __tablename__ = 'migration_waves'

    id = db.Column(db.String(50), primary_key=True)
    project_id = db.Column(db.String(50), db.ForeignKey('migration_projects.id'), nullable=False)
    wave_number = db.Column(db.Integer, nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(50), default='planned')  # planned, in-progress, completed, blocked

    # Wave dates
    planned_start_date = db.Column(db.DateTime)
    planned_end_date = db.Column(db.DateTime)
    actual_start_date = db.Column(db.DateTime)
    actual_end_date = db.Column(db.DateTime)

    # Wave metrics
    applications_count = db.Column(db.Integer, default=0)
    data_size_gb = db.Column(db.Float)
    estimated_downtime_hours = db.Column(db.Integer)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    applications = db.relationship('Application', backref='wave', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'wave_number': self.wave_number,
            'name': self.name,
            'description': self.description,
            'status': self.status,
            'applications_count': self.applications_count,
            'data_size_gb': self.data_size_gb,
            'estimated_downtime_hours': self.estimated_downtime_hours,
            'planned_start_date': self.planned_start_date.isoformat() if self.planned_start_date else None,
            'planned_end_date': self.planned_end_date.isoformat() if self.planned_end_date else None
        }

class Application(db.Model):
    """Application model for workload management"""
    __tablename__ = 'applications'

    id = db.Column(db.String(50), primary_key=True)
    project_id = db.Column(db.String(50), db.ForeignKey('migration_projects.id'), nullable=False)
    wave_id = db.Column(db.String(50), db.ForeignKey('migration_waves.id'), nullable=True)

    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    current_platform = db.Column(db.String(100))  # mainframe, aix, windows, linux, etc.
    target_platform = db.Column(db.String(100))   # kubernetes, lambda, app-service, etc.

    # Application metrics
    database_size_gb = db.Column(db.Float)
    storage_size_gb = db.Column(db.Float)
    complexity_level = db.Column(db.String(50))  # low, medium, high, very-high
    criticality = db.Column(db.String(50))        # low, medium, high, critical
    dependencies = db.Column(db.Text)             # JSON array

    # Status
    migration_status = db.Column(db.String(50), default='not-started')
    assessment_status = db.Column(db.String(50), default='pending')

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'wave_id': self.wave_id,
            'name': self.name,
            'description': self.description,
            'current_platform': self.current_platform,
            'target_platform': self.target_platform,
            'database_size_gb': self.database_size_gb,
            'storage_size_gb': self.storage_size_gb,
            'complexity_level': self.complexity_level,
            'criticality': self.criticality,
            'migration_status': self.migration_status,
            'assessment_status': self.assessment_status
        }

class ArchitectureRecommendation(db.Model):
    """Architecture recommendations model"""
    __tablename__ = 'architecture_recommendations'

    id = db.Column(db.String(50), primary_key=True)
    assessment_id = db.Column(db.String(50), db.ForeignKey('assessments.id'), nullable=False)

    architecture_type = db.Column(db.String(100))  # microservices, monolith, serverless, etc.
    target_platform = db.Column(db.String(100))    # kubernetes, lambda, container, vm, etc.
    suitability_score = db.Column(db.Integer)      # 0-100
    justification = db.Column(db.Text)

    # Recommendation details
    pros = db.Column(db.Text)            # JSON array
    cons = db.Column(db.Text)            # JSON array
    cost_estimate = db.Column(db.Float)
    implementation_effort_weeks = db.Column(db.Integer)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'assessment_id': self.assessment_id,
            'architecture_type': self.architecture_type,
            'target_platform': self.target_platform,
            'suitability_score': self.suitability_score,
            'justification': self.justification,
            'pros': json.loads(self.pros) if self.pros else [],
            'cons': json.loads(self.cons) if self.cons else [],
            'cost_estimate': self.cost_estimate,
            'implementation_effort_weeks': self.implementation_effort_weeks
        }
