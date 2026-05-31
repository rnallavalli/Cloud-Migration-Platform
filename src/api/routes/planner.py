"""Migration Planner API routes — file upload, analysis, plan retrieval"""
from flask import Blueprint, request, jsonify
from src.migration.planner import parse_file, generate_migration_plan
import json, os

planner_bp = Blueprint('planner', __name__, url_prefix='/api/v1/planner')

# In-memory store for demo (in production, persist to DB)
_plans = {}

@planner_bp.route('/upload', methods=['POST'])
def upload_and_analyze():
    """
    Accept a CSV/Excel infrastructure spreadsheet + provider,
    parse it, run the full analysis and return a migration plan.
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded — include file in multipart form-data'}), 400

    file     = request.files['file']
    provider = request.form.get('provider', 'aws').lower()
    project  = request.form.get('project_name', 'Migration Project')

    if not file.filename:
        return jsonify({'error': 'Empty filename'}), 400

    if provider not in ('aws', 'azure', 'gcp'):
        return jsonify({'error': "provider must be 'aws', 'azure', or 'gcp'"}), 400

    try:
        file_bytes = file.read()
        assets, warnings = parse_file(file_bytes, file.filename)
        plan = generate_migration_plan(assets, provider, project)

        # Store plan for retrieval
        _plans[plan['id']] = plan

        return jsonify({
            'plan_id':       plan['id'],
            'warnings':      warnings,
            'total_assets':  plan['total_assets'],
            'total_waves':   plan['total_waves'],
            'total_weeks':   plan['total_weeks'],
            'financials':    plan['financials'],
            'plan':          plan,
        }), 200

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500


@planner_bp.route('/plans', methods=['GET'])
def list_plans():
    """List all generated migration plans (summary only)"""
    summaries = [
        {
            'id':             p['id'],
            'project_name':   p['project_name'],
            'provider':       p['provider'],
            'generated_at':   p['generated_at'],
            'total_assets':   p['total_assets'],
            'total_waves':    p['total_waves'],
            'total_weeks':    p['total_weeks'],
            'migration_cost': p['financials']['total_migration_cost'],
            'roi_months':     p['financials']['roi_months'],
        }
        for p in _plans.values()
    ]
    return jsonify(summaries), 200


@planner_bp.route('/plans/<plan_id>', methods=['GET'])
def get_plan(plan_id):
    """Get a full migration plan by ID"""
    plan = _plans.get(plan_id)
    if not plan:
        return jsonify({'error': 'Plan not found'}), 404
    return jsonify(plan), 200


@planner_bp.route('/template', methods=['GET'])
def download_template():
    """Return a sample CSV template for the user to fill in"""
    csv = (
        "Asset Name,Asset Type,Current Platform,OS,CPU Cores,RAM GB,Storage GB,"
        "Database Size GB,Database Engine,Complexity,Criticality,Environment,"
        "Dependencies,Internet Facing,Data Classification,Annual License Cost,Notes\n"
        "web-server-01,Web Server,VMware,Linux,4,8,100,0,,medium,high,production,,yes,internal,0,Apache web server\n"
        "api-server-01,App Server,Bare Metal,Linux,8,16,200,0,,high,critical,production,web-server-01,no,confidential,0,Core business API\n"
        "db-postgres-01,Database,VMware,Linux,16,32,500,300,PostgreSQL,high,critical,production,api-server-01,no,restricted,12000,Primary database\n"
        "cache-redis-01,Cache,VMware,Linux,4,8,50,0,Redis,low,medium,production,api-server-01,no,internal,0,Session cache\n"
        "file-server-01,File Storage,Bare Metal,Windows,4,8,2000,0,,low,medium,production,,no,confidential,5000,Document storage\n"
        "lb-01,Load Balancer,Physical,Linux,2,4,20,0,,low,high,production,,yes,internal,0,F5 load balancer\n"
        "jenkins-01,DevOps,VMware,Linux,4,8,100,0,,medium,medium,production,,no,internal,0,CI/CD server\n"
        "dev-app-01,App Server,VMware,Linux,2,4,50,0,,low,low,dev,,no,internal,0,Development instance\n"
        "test-db-01,Database,VMware,Linux,4,8,100,20,MySQL,low,low,test,,no,internal,0,Test database\n"
        "monitoring-01,Monitoring,VMware,Linux,4,8,200,0,,low,medium,production,,no,internal,0,Nagios monitoring\n"
    )
    from flask import Response
    return Response(
        csv,
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=migration_assets_template.csv'}
    )
