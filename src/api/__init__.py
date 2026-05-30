"""Cloud Migration Platform API Module"""
from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import os

load_dotenv()

db = SQLAlchemy()

def create_app(config_name='development'):
    """Application factory"""
    app = Flask(__name__)

    # Load configuration
    if config_name == 'testing':
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        app.config['TESTING'] = True
    else:
        app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
            'DATABASE_URL',
            'postgresql://cmp_user:cmp_password@localhost:5432/cloud_migration_db'
        )

    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JSON_SORT_KEYS'] = False

    # Initialize extensions
    db.init_app(app)
    CORS(app)

    # Register blueprints
    from src.api.routes import assessment_bp, project_bp, recommendation_bp, health_bp
    app.register_blueprint(health_bp)
    app.register_blueprint(assessment_bp)
    app.register_blueprint(project_bp)
    app.register_blueprint(recommendation_bp)

    # Create tables
    with app.app_context():
        db.create_all()

    return app
