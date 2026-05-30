"""Utility functions for API"""
import uuid
from functools import wraps
from flask import jsonify, request

def generate_id(prefix=''):
    """Generate unique ID with prefix"""
    unique_id = str(uuid.uuid4())[:8]
    if prefix:
        return f"{prefix}-{unique_id}"
    return unique_id

def validate_request(*expected_args):
    """Decorator to validate required request arguments"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            data = request.get_json()
            if not data:
                return jsonify({'error': 'Invalid JSON'}), 400

            missing = [arg for arg in expected_args if arg not in data]
            if missing:
                return jsonify({'error': f'Missing fields: {missing}'}), 400

            return f(*args, **kwargs)
        return decorated_function
    return decorator

def handle_errors(f):
    """Decorator for error handling"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except ValueError as e:
            return jsonify({'error': f'Validation error: {str(e)}'}), 400
        except Exception as e:
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    return decorated_function
