"""
Comprehensive Migration Planner Engine
Parses infrastructure spreadsheets and generates detailed wave-by-wave migration plans
covering architecture, cost, security, deployment and production readiness.
"""

import pandas as pd
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from io import BytesIO


# ── Asset classification maps ────────────────────────────────────────────────
ASSET_TYPE_ALIASES = {
    'web server': 'Web Server', 'webserver': 'Web Server', 'web': 'Web Server',
    'apache': 'Web Server', 'nginx': 'Web Server', 'iis': 'Web Server',
    'app server': 'App Server', 'application server': 'App Server', 'app': 'App Server',
    'api server': 'App Server', 'microservice': 'App Server', 'service': 'App Server',
    'database': 'Database', 'db': 'Database', 'rdbms': 'Database',
    'mysql': 'Database', 'postgres': 'Database', 'postgresql': 'Database',
    'sql server': 'Database', 'oracle': 'Database', 'mariadb': 'Database',
    'mongodb': 'Database', 'nosql': 'Database',
    'cache': 'Cache', 'redis': 'Cache', 'memcached': 'Cache', 'elasticache': 'Cache',
    'file server': 'File Storage', 'file storage': 'File Storage', 'nfs': 'File Storage',
    'nas': 'File Storage', 'san': 'File Storage', 'storage': 'File Storage',
    'load balancer': 'Load Balancer', 'lb': 'Load Balancer', 'f5': 'Load Balancer',
    'haproxy': 'Load Balancer', 'elb': 'Load Balancer',
    'container': 'Container', 'docker': 'Container', 'k8s': 'Container',
    'kubernetes': 'Container', 'pod': 'Container',
    'virtual machine': 'VM', 'vm': 'VM', 'vmware': 'VM', 'vsphere': 'VM',
    'hyper-v': 'VM', 'kvm': 'VM',
    'bare metal': 'Bare Metal', 'physical': 'Bare Metal', 'server': 'Bare Metal',
    'message queue': 'Messaging', 'queue': 'Messaging', 'rabbitmq': 'Messaging',
    'kafka': 'Messaging', 'activemq': 'Messaging',
    'monitoring': 'Monitoring', 'nagios': 'Monitoring', 'zabbix': 'Monitoring',
    'ci/cd': 'DevOps', 'jenkins': 'DevOps', 'gitlab': 'DevOps', 'devops': 'DevOps',
    'dns': 'Networking', 'firewall': 'Networking', 'vpn': 'Networking',
    'proxy': 'Networking', 'gateway': 'Networking',
}

# Target platform mapping per asset type
TARGET_MAP = {
    'aws': {
        'Web Server':    {'service': 'EC2 + ALB',          'tf': 'aws_instance',             'managed': 'ECS/Fargate',      'icon': '🌐'},
        'App Server':    {'service': 'EC2 / ECS',           'tf': 'aws_ecs_service',          'managed': 'EKS',              'icon': '⚙️'},
        'Database':      {'service': 'RDS',                 'tf': 'aws_db_instance',          'managed': 'Aurora Serverless','icon': '🗄️'},
        'Cache':         {'service': 'ElastiCache',         'tf': 'aws_elasticache_cluster',  'managed': 'ElastiCache',      'icon': '⚡'},
        'File Storage':  {'service': 'S3 / EFS',            'tf': 'aws_s3_bucket',            'managed': 'S3',               'icon': '📦'},
        'Load Balancer': {'service': 'ALB / NLB',           'tf': 'aws_lb',                   'managed': 'ALB',              'icon': '⚖️'},
        'Container':     {'service': 'EKS / ECS',           'tf': 'aws_eks_cluster',          'managed': 'EKS',              'icon': '🐳'},
        'VM':            {'service': 'EC2',                 'tf': 'aws_instance',             'managed': 'EC2 Auto Scaling', 'icon': '💻'},
        'Bare Metal':    {'service': 'EC2 Bare Metal',      'tf': 'aws_instance',             'managed': 'EC2',              'icon': '🖥️'},
        'Messaging':     {'service': 'SQS / SNS',           'tf': 'aws_sqs_queue',            'managed': 'Amazon MQ',        'icon': '📨'},
        'Monitoring':    {'service': 'CloudWatch',          'tf': 'aws_cloudwatch_dashboard', 'managed': 'CloudWatch',       'icon': '📊'},
        'DevOps':        {'service': 'CodePipeline',        'tf': 'aws_codepipeline',         'managed': 'CodePipeline',     'icon': '🔄'},
        'Networking':    {'service': 'VPC / Route53',       'tf': 'aws_vpc',                  'managed': 'Route53',          'icon': '🔗'},
    },
    'azure': {
        'Web Server':    {'service': 'App Service',         'tf': 'azurerm_app_service',          'managed': 'App Service',      'icon': '🌐'},
        'App Server':    {'service': 'AKS / App Service',   'tf': 'azurerm_kubernetes_cluster',   'managed': 'AKS',              'icon': '⚙️'},
        'Database':      {'service': 'Azure SQL / Cosmos',  'tf': 'azurerm_sql_database',         'managed': 'Azure SQL',        'icon': '🗄️'},
        'Cache':         {'service': 'Azure Cache for Redis','tf': 'azurerm_redis_cache',          'managed': 'Redis Cache',      'icon': '⚡'},
        'File Storage':  {'service': 'Blob Storage / Files','tf': 'azurerm_storage_account',      'managed': 'Blob Storage',     'icon': '📦'},
        'Load Balancer': {'service': 'Azure Load Balancer', 'tf': 'azurerm_lb',                   'managed': 'App Gateway',      'icon': '⚖️'},
        'Container':     {'service': 'AKS',                 'tf': 'azurerm_kubernetes_cluster',   'managed': 'AKS',              'icon': '🐳'},
        'VM':            {'service': 'Azure VM',            'tf': 'azurerm_linux_virtual_machine','managed': 'VMSS',             'icon': '💻'},
        'Bare Metal':    {'service': 'Azure Bare Metal',    'tf': 'azurerm_linux_virtual_machine','managed': 'Azure VM',         'icon': '🖥️'},
        'Messaging':     {'service': 'Service Bus',         'tf': 'azurerm_servicebus_namespace', 'managed': 'Service Bus',      'icon': '📨'},
        'Monitoring':    {'service': 'Azure Monitor',       'tf': 'azurerm_monitor_action_group', 'managed': 'Azure Monitor',    'icon': '📊'},
        'DevOps':        {'service': 'Azure DevOps',        'tf': 'azurerm_devops_project',       'managed': 'Azure DevOps',     'icon': '🔄'},
        'Networking':    {'service': 'VNet / Azure DNS',    'tf': 'azurerm_virtual_network',      'managed': 'Azure DNS',        'icon': '🔗'},
    },
    'gcp': {
        'Web Server':    {'service': 'Cloud Run / GCE',     'tf': 'google_cloud_run_service',     'managed': 'Cloud Run',        'icon': '🌐'},
        'App Server':    {'service': 'GKE / Cloud Run',     'tf': 'google_container_cluster',     'managed': 'GKE',              'icon': '⚙️'},
        'Database':      {'service': 'Cloud SQL / Spanner', 'tf': 'google_sql_database_instance', 'managed': 'Cloud SQL',        'icon': '🗄️'},
        'Cache':         {'service': 'Memorystore',         'tf': 'google_redis_instance',        'managed': 'Memorystore',      'icon': '⚡'},
        'File Storage':  {'service': 'Cloud Storage / GCS', 'tf': 'google_storage_bucket',        'managed': 'Cloud Storage',    'icon': '📦'},
        'Load Balancer': {'service': 'Cloud Load Balancing','tf': 'google_compute_forwarding_rule','managed': 'Cloud LB',        'icon': '⚖️'},
        'Container':     {'service': 'GKE',                 'tf': 'google_container_cluster',     'managed': 'GKE Autopilot',    'icon': '🐳'},
        'VM':            {'service': 'Compute Engine',      'tf': 'google_compute_instance',      'managed': 'Managed Instance', 'icon': '💻'},
        'Bare Metal':    {'service': 'Bare Metal Solution', 'tf': 'google_compute_instance',      'managed': 'GCE',              'icon': '🖥️'},
        'Messaging':     {'service': 'Pub/Sub',             'tf': 'google_pubsub_topic',          'managed': 'Pub/Sub',          'icon': '📨'},
        'Monitoring':    {'service': 'Cloud Monitoring',    'tf': 'google_monitoring_dashboard',  'managed': 'Cloud Monitoring', 'icon': '📊'},
        'DevOps':        {'service': 'Cloud Build',         'tf': 'google_cloudbuild_trigger',    'managed': 'Cloud Build',      'icon': '🔄'},
        'Networking':    {'service': 'VPC / Cloud DNS',     'tf': 'google_compute_network',       'managed': 'Cloud DNS',        'icon': '🔗'},
    },
}

# Migration strategy per complexity + environment
def get_strategy(asset: dict) -> dict:
    complexity = asset.get('complexity', 'medium').lower()
    env        = asset.get('environment', 'production').lower()
    atype      = asset.get('asset_type', 'VM')
    eol        = asset.get('end_of_life', False)

    if eol or env in ('dev', 'test', 'development'):
        return {'strategy': 'Rehost', 'code': 'lift-shift', 'effort': 'low', 'description': 'Direct lift-and-shift to cloud VM/container equivalent'}

    if atype in ('Container', 'Messaging') or complexity in ('low',):
        return {'strategy': 'Rehost', 'code': 'lift-shift', 'effort': 'low', 'description': 'Direct lift-and-shift — already cloud-compatible'}

    if atype in ('Web Server', 'Cache', 'Load Balancer', 'File Storage'):
        return {'strategy': 'Replatform', 'code': 'replatform', 'effort': 'medium', 'description': 'Minor changes to adopt managed cloud services'}

    if complexity in ('high', 'very-high') or atype == 'Database':
        return {'strategy': 'Refactor', 'code': 'refactor', 'effort': 'high', 'description': 'Significant rearchitecting to leverage cloud-native capabilities'}

    if atype == 'App Server':
        return {'strategy': 'Replatform', 'code': 'replatform', 'effort': 'medium', 'description': 'Containerise and deploy to managed Kubernetes'}

    return {'strategy': 'Rehost', 'code': 'lift-shift', 'effort': 'medium', 'description': 'Standard lift-and-shift migration'}


# ── Cost estimation ──────────────────────────────────────────────────────────
COST_CONFIG = {
    'aws': {
        'compute_per_vcpu_monthly':  20.0,
        'compute_per_gb_ram_monthly': 5.0,
        'storage_per_gb_monthly':     0.025,
        'db_per_gb_monthly':          0.115,
        'transfer_per_gb':            0.09,
        'support_multiplier':         1.10,
    },
    'azure': {
        'compute_per_vcpu_monthly':  18.0,
        'compute_per_gb_ram_monthly': 4.5,
        'storage_per_gb_monthly':     0.018,
        'db_per_gb_monthly':          0.10,
        'transfer_per_gb':            0.087,
        'support_multiplier':         1.10,
    },
    'gcp': {
        'compute_per_vcpu_monthly':  17.0,
        'compute_per_gb_ram_monthly': 4.2,
        'storage_per_gb_monthly':     0.020,
        'db_per_gb_monthly':          0.095,
        'transfer_per_gb':            0.085,
        'support_multiplier':         1.08,
    },
}

EFFORT_WEEKS = {'low': 2, 'medium': 5, 'high': 10, 'very-high': 18}
ENGINEER_COST_PER_WEEK = 4000  # USD blended rate

def estimate_asset_cost(asset: dict, provider: str) -> dict:
    cfg = COST_CONFIG.get(provider, COST_CONFIG['aws'])
    cpu = asset.get('cpu_cores', 2)
    ram = asset.get('ram_gb', 4)
    storage = asset.get('storage_gb', 50)
    db_size = asset.get('database_size_gb', 0)
    strategy = asset.get('strategy_code', 'lift-shift')
    complexity = asset.get('complexity', 'medium').lower()

    # Monthly cloud run cost
    compute_monthly = (cpu * cfg['compute_per_vcpu_monthly']) + (ram * cfg['compute_per_gb_ram_monthly'])
    storage_monthly = storage * cfg['storage_per_gb_monthly']
    db_monthly = db_size * cfg['db_per_gb_monthly'] if db_size > 0 else 0
    base_monthly = (compute_monthly + storage_monthly + db_monthly) * cfg['support_multiplier']

    # One-time migration cost
    effort_weeks = EFFORT_WEEKS.get(complexity, 5)
    if strategy == 'refactor':
        effort_weeks = int(effort_weeks * 2.2)
    elif strategy == 'replatform':
        effort_weeks = int(effort_weeks * 1.5)

    migration_cost = effort_weeks * ENGINEER_COST_PER_WEEK
    license_savings = asset.get('annual_license_cost', 0) * 0.4  # typically save 40%

    # Annual cloud cost vs annual savings
    annual_cloud = base_monthly * 12
    annual_on_prem_estimate = base_monthly * 12 * 1.6  # cloud typically 40% cheaper
    annual_savings = (annual_on_prem_estimate - annual_cloud) + license_savings

    return {
        'monthly_cloud_cost': round(base_monthly, 2),
        'annual_cloud_cost':  round(annual_cloud, 2),
        'migration_cost':     round(migration_cost, 2),
        'effort_weeks':       effort_weeks,
        'annual_savings':     round(annual_savings, 2),
        'roi_months':         round(migration_cost / max(annual_savings / 12, 1), 1),
        'breakdown': {
            'compute':  round(compute_monthly, 2),
            'storage':  round(storage_monthly, 2),
            'database': round(db_monthly, 2),
        }
    }


# ── Security assessment ──────────────────────────────────────────────────────
SECURITY_CHECKS = {
    'Web Server':    ['WAF deployment', 'TLS 1.3 certificate', 'DDoS protection', 'CDN integration', 'OWASP Top 10 scan'],
    'App Server':    ['Service-to-service mTLS', 'Secrets manager integration', 'IAM role least-privilege', 'Container image scanning'],
    'Database':      ['Encryption at rest', 'Encryption in transit', 'Private subnet placement', 'Automated backups', 'Audit logging', 'No public access'],
    'Cache':         ['VPC-only access', 'Auth token', 'Encryption in transit'],
    'Load Balancer': ['Security group rules', 'SSL/TLS termination', 'Access logs enabled'],
    'File Storage':  ['Bucket policy review', 'Versioning enabled', 'Access logging', 'No public read'],
    'Container':     ['Image vulnerability scanning', 'Pod security policies', 'Network policies', 'RBAC configuration'],
    'VM':            ['Security baseline hardening', 'Patch management', 'Endpoint protection', 'SSH key-only access'],
    'Bare Metal':    ['Network segmentation', 'Physical security audit', 'Firmware updates', 'IDS/IPS'],
    'Messaging':     ['Message encryption', 'Dead-letter queues', 'IAM policies', 'VPC endpoints'],
    'Monitoring':    ['Centralized logging', 'Alert fatigue review', 'SIEM integration'],
    'DevOps':        ['Pipeline secrets scanning', 'SAST/DAST integration', 'Dependency vulnerability scan'],
    'Networking':    ['Network ACL review', 'VPC flow logs', 'Route table audit'],
}

DATA_CLASSIFICATION_EXTRAS = {
    'restricted':     ['HSM key management', 'Data masking/tokenization', 'Regulatory compliance audit (PCI/HIPAA)', 'Data Loss Prevention'],
    'confidential':   ['Encryption key rotation', 'Access audit trail', 'Data residency compliance'],
    'internal':       ['Role-based access control', 'Access review quarterly'],
    'public':         ['Content integrity checks'],
}


# ── Architecture recommendations ─────────────────────────────────────────────
def get_architecture_notes(asset: dict, provider: str) -> dict:
    atype  = asset.get('asset_type', 'VM')
    target = TARGET_MAP.get(provider, TARGET_MAP['aws']).get(atype, TARGET_MAP['aws']['VM'])
    strategy = asset.get('strategy_code', 'lift-shift')

    notes = []
    if strategy == 'refactor':
        notes.append(f"Decompose into microservices before migration")
        notes.append(f"Adopt 12-factor app principles")
        notes.append(f"Implement CI/CD pipeline before cutover")
    elif strategy == 'replatform':
        notes.append(f"Containerise application with Docker")
        notes.append(f"Update connection strings to managed service endpoints")
    else:
        notes.append(f"Deploy to {target['service']} using same configuration")
        notes.append(f"Validate all integrations in staging first")

    if atype == 'Database':
        notes.append("Run Database Migration Service (DMS) assessment")
        notes.append("Plan for schema conversion if changing DB engine")
        notes.append("Validate application query performance post-migration")
    if atype == 'Web Server':
        notes.append("Configure health checks and auto-scaling policies")
        notes.append("Update DNS with TTL reduction 48h before cutover")

    return {
        'target_service':    target['service'],
        'managed_option':    target['managed'],
        'terraform_resource': target['tf'],
        'architecture_notes': notes,
        'pattern':           'Cloud-native' if strategy == 'refactor' else ('Containerised' if strategy == 'replatform' else 'Lift-and-shift'),
    }


# ── Deployment checklist ──────────────────────────────────────────────────────
def get_deployment_steps(asset: dict, wave_number: int, provider: str) -> List[dict]:
    strategy = asset.get('strategy_code', 'lift-shift')
    env      = asset.get('environment', 'production').lower()
    atype    = asset.get('asset_type', 'VM')

    pre = [
        {'phase': 'Pre-Migration', 'step': f'Baseline performance metrics capture', 'owner': 'Ops', 'days': 1},
        {'phase': 'Pre-Migration', 'step': f'Dependency mapping validation for {asset["name"]}', 'owner': 'Architect', 'days': 1},
        {'phase': 'Pre-Migration', 'step': 'Rollback plan documented and tested', 'owner': 'Lead', 'days': 1},
        {'phase': 'Pre-Migration', 'step': f'Stakeholder sign-off for Wave {wave_number}', 'owner': 'PM', 'days': 1},
    ]

    if strategy in ('replatform', 'refactor'):
        pre.append({'phase': 'Pre-Migration', 'step': 'Docker image build + push to registry', 'owner': 'DevOps', 'days': 2})
    if strategy == 'refactor':
        pre.append({'phase': 'Pre-Migration', 'step': 'Microservices decomposition & API contract freeze', 'owner': 'Dev', 'days': 5})

    migration = [
        {'phase': 'Migration',     'step': f'Provision {provider.upper()} infrastructure via Terraform', 'owner': 'DevOps', 'days': 1},
        {'phase': 'Migration',     'step': f'Deploy {asset["name"]} to {TARGET_MAP[provider].get(atype,{}).get("service","cloud")}', 'owner': 'DevOps', 'days': 2},
        {'phase': 'Migration',     'step': 'Data sync / replication validation', 'owner': 'DBA', 'days': 2 if atype == 'Database' else 1},
        {'phase': 'Migration',     'step': 'Integration smoke tests', 'owner': 'QA', 'days': 1},
        {'phase': 'Migration',     'step': 'Performance benchmark (compare vs baseline)', 'owner': 'Ops', 'days': 1},
    ]

    cutover = [
        {'phase': 'Cutover',       'step': 'DNS/routing cutover (blue-green or canary)', 'owner': 'Ops', 'days': 1},
        {'phase': 'Cutover',       'step': 'Hypercare monitoring period (48h)', 'owner': 'Ops', 'days': 2},
        {'phase': 'Cutover',       'step': 'Decommission on-premise resource', 'owner': 'Infra', 'days': 3},
    ]

    prod = [
        {'phase': 'Post-Migration','step': 'Enable auto-scaling policies', 'owner': 'DevOps', 'days': 1},
        {'phase': 'Post-Migration','step': 'Configure CloudWatch/Monitor/Stackdriver alerts', 'owner': 'Ops', 'days': 1},
        {'phase': 'Post-Migration','step': 'Cost optimisation review (right-sizing)', 'owner': 'FinOps', 'days': 2},
        {'phase': 'Post-Migration','step': 'Security posture validation', 'owner': 'SecOps', 'days': 1},
        {'phase': 'Post-Migration','step': 'Runbook and documentation update', 'owner': 'Ops', 'days': 1},
    ]

    return pre + migration + cutover + prod


# ── Wave assignment ───────────────────────────────────────────────────────────
CRITICALITY_ORDER = {'low': 0, 'medium': 1, 'high': 2, 'critical': 3}
COMPLEXITY_ORDER  = {'low': 0, 'medium': 1, 'high': 2, 'very-high': 3}
ENV_ORDER         = {'dev': 0, 'test': 1, 'development': 0, 'staging': 1, 'uat': 2, 'production': 3, 'prod': 3}

def assign_waves(assets: List[dict]) -> List[dict]:
    """
    Wave assignment strategy:
    Wave 1: Dev/Test/Staging environments — lowest risk, proves the process
    Wave 2: Low-criticality production apps, no critical dependencies
    Wave 3: Medium-criticality apps, moderate dependencies
    Wave 4: High-criticality apps, complex dependency chains
    Wave 5: Mission-critical / databases / tightly coupled systems
    """
    # Build dependency graph
    name_map = {a['name']: a for a in assets}

    def get_wave(asset):
        env  = asset.get('environment', 'production').lower()
        crit = asset.get('criticality', 'medium').lower()
        comp = asset.get('complexity', 'medium').lower()
        deps = [d.strip() for d in asset.get('dependencies', '').split(',') if d.strip()]
        has_critical_deps = any(
            name_map.get(d, {}).get('criticality', 'medium') in ('high', 'critical') for d in deps
        )

        env_level  = ENV_ORDER.get(env, 3)
        crit_level = CRITICALITY_ORDER.get(crit, 1)
        comp_level = COMPLEXITY_ORDER.get(comp, 1)

        if env_level <= 1:          return 1   # dev/test
        if crit_level == 0 and comp_level <= 1: return 2
        if has_critical_deps:       return max(4, crit_level + 2)
        if crit_level <= 1 and comp_level <= 1: return 2
        if crit_level <= 2 and comp_level <= 2: return 3
        if crit_level == 3 or comp_level >= 3:  return 5
        return 4

    for asset in assets:
        asset['wave'] = get_wave(asset)

    return sorted(assets, key=lambda a: (a['wave'], CRITICALITY_ORDER.get(a.get('criticality','medium'), 1)))


# ── Main parser ───────────────────────────────────────────────────────────────
REQUIRED_COLS   = ['name']
OPTIONAL_COLS   = {
    'asset_type': 'VM', 'current_platform': 'Unknown', 'os': 'Linux',
    'cpu_cores': 2, 'ram_gb': 4, 'storage_gb': 50, 'database_size_gb': 0,
    'database_engine': '', 'complexity': 'medium', 'criticality': 'medium',
    'environment': 'production', 'dependencies': '', 'internet_facing': 'no',
    'data_classification': 'internal', 'annual_license_cost': 0, 'notes': '',
}

COL_ALIASES = {
    'asset name': 'name', 'server': 'name', 'hostname': 'name', 'host': 'name', 'application': 'name',
    'type': 'asset_type', 'server type': 'asset_type', 'role': 'asset_type', 'workload type': 'asset_type',
    'platform': 'current_platform', 'source platform': 'current_platform', 'current env': 'current_platform',
    'operating system': 'os', 'os version': 'os', 'os type': 'os',
    'cpu': 'cpu_cores', 'vcpu': 'cpu_cores', 'cores': 'cpu_cores', 'processors': 'cpu_cores',
    'ram': 'ram_gb', 'memory': 'ram_gb', 'memory gb': 'ram_gb', 'ram (gb)': 'ram_gb',
    'disk': 'storage_gb', 'storage': 'storage_gb', 'disk gb': 'storage_gb', 'storage (gb)': 'storage_gb',
    'db size': 'database_size_gb', 'database size': 'database_size_gb', 'db size (gb)': 'database_size_gb',
    'db engine': 'database_engine', 'database type': 'database_engine', 'db type': 'database_engine',
    'complex': 'complexity', 'migration complexity': 'complexity',
    'critical': 'criticality', 'business criticality': 'criticality', 'priority': 'criticality',
    'env': 'environment', 'tier': 'environment',
    'dependency': 'dependencies', 'depends on': 'dependencies', 'upstream': 'dependencies',
    'public facing': 'internet_facing', 'external': 'internet_facing',
    'data class': 'data_classification', 'sensitivity': 'data_classification', 'classification': 'data_classification',
    'license cost': 'annual_license_cost', 'annual cost': 'annual_license_cost', 'licensing': 'annual_license_cost',
    'comment': 'notes', 'description': 'notes', 'remarks': 'notes',
}

def _normalise_col(col: str) -> str:
    c = col.strip().lower()
    return COL_ALIASES.get(c, c.replace(' ', '_').replace('(', '').replace(')', '').replace('-', '_'))

def _normalise_value(col: str, val) -> any:
    if pd.isna(val):
        return OPTIONAL_COLS.get(col, '')
    if col == 'asset_type':
        return ASSET_TYPE_ALIASES.get(str(val).strip().lower(), str(val).strip())
    if col in ('cpu_cores', 'ram_gb', 'storage_gb', 'database_size_gb', 'annual_license_cost'):
        try:    return float(str(val).replace(',', '').replace('GB', '').replace('gb', '').strip())
        except: return OPTIONAL_COLS.get(col, 0)
    if col in ('internet_facing',):
        return str(val).strip().lower() in ('yes', 'y', 'true', '1', 'x')
    if col == 'complexity':
        v = str(val).strip().lower()
        mapping = {'1': 'low', '2': 'medium', '3': 'high', '4': 'very-high', 'very high': 'very-high'}
        return mapping.get(v, v if v in ('low','medium','high','very-high') else 'medium')
    if col == 'criticality':
        v = str(val).strip().lower()
        mapping = {'1': 'low', '2': 'medium', '3': 'high', '4': 'critical', 'business critical': 'critical'}
        return mapping.get(v, v if v in ('low','medium','high','critical') else 'medium')
    if col == 'data_classification':
        v = str(val).strip().lower()
        return v if v in ('public','internal','confidential','restricted') else 'internal'
    return str(val).strip()


def parse_file(file_bytes: bytes, filename: str) -> Tuple[List[dict], List[str]]:
    """Parse CSV or Excel file into list of asset dicts. Returns (assets, warnings)."""
    warnings = []
    try:
        if filename.lower().endswith('.csv'):
            df = pd.read_csv(BytesIO(file_bytes))
        elif filename.lower().endswith(('.xlsx', '.xls', '.xlsm')):
            df = pd.read_excel(BytesIO(file_bytes), engine='openpyxl')
        else:
            raise ValueError(f"Unsupported file type: {filename}. Use .csv, .xlsx, or .xls")
    except Exception as e:
        raise ValueError(f"Failed to parse file: {str(e)}")

    if df.empty:
        raise ValueError("File is empty or has no data rows")

    # Normalise column names
    df.columns = [_normalise_col(c) for c in df.columns]

    if 'name' not in df.columns:
        # Try first column as name
        df = df.rename(columns={df.columns[0]: 'name'})
        warnings.append("First column used as asset name")

    # Apply defaults for missing columns
    for col, default in OPTIONAL_COLS.items():
        if col not in df.columns:
            df[col] = default
            warnings.append(f"Column '{col}' not found — using default '{default}'")

    assets = []
    for idx, row in df.iterrows():
        if pd.isna(row.get('name', None)) or str(row.get('name', '')).strip() == '':
            continue
        asset = {col: _normalise_value(col, row.get(col, OPTIONAL_COLS.get(col, '')))
                 for col in ['name'] + list(OPTIONAL_COLS.keys())}
        asset['id'] = str(uuid.uuid4())[:8]
        assets.append(asset)

    if not assets:
        raise ValueError("No valid assets found in file")

    return assets, warnings


# ── Plan generator (main entry point) ────────────────────────────────────────
def generate_migration_plan(assets: List[dict], provider: str, project_name: str) -> dict:
    """Generate a comprehensive migration plan from parsed assets."""

    # 1. Enrich each asset
    for asset in assets:
        strategy_info     = get_strategy(asset)
        arch_info         = get_architecture_notes(asset, provider)
        cost_info         = estimate_asset_cost({**asset, 'strategy_code': strategy_info['code']}, provider)
        security_checks   = SECURITY_CHECKS.get(asset.get('asset_type', 'VM'), [])
        data_extras       = DATA_CLASSIFICATION_EXTRAS.get(asset.get('data_classification', 'internal'), [])

        asset.update({
            'strategy':         strategy_info['strategy'],
            'strategy_code':    strategy_info['code'],
            'strategy_effort':  strategy_info['effort'],
            'strategy_desc':    strategy_info['description'],
            'target_service':   arch_info['target_service'],
            'managed_option':   arch_info['managed_option'],
            'terraform_resource': arch_info['terraform_resource'],
            'architecture_notes': arch_info['architecture_notes'],
            'arch_pattern':     arch_info['pattern'],
            'cost':             cost_info,
            'security_checks':  security_checks + data_extras,
            'deployment_steps': get_deployment_steps(asset, 1, provider),  # wave updated below
        })

    # 2. Assign waves
    assets = assign_waves(assets)

    # 3. Update deployment steps with correct wave number
    for asset in assets:
        asset['deployment_steps'] = get_deployment_steps(asset, asset['wave'], provider)

    # 4. Group by wave
    waves_map: Dict[int, List] = {}
    for asset in assets:
        w = asset['wave']
        waves_map.setdefault(w, []).append(asset)

    waves = []
    plan_start = datetime.now() + timedelta(weeks=2)
    running_start = plan_start

    total_cost        = 0.0
    total_migration_cost = 0.0
    total_monthly     = 0.0

    for wave_num in sorted(waves_map.keys()):
        wave_assets = waves_map[wave_num]
        effort_weeks = max(a['cost']['effort_weeks'] for a in wave_assets)
        # Parallel track — max effort + 20% coordination overhead
        wave_effort  = int(effort_weeks * 1.2)
        wave_cost    = sum(a['cost']['migration_cost'] for a in wave_assets)
        wave_monthly = sum(a['cost']['monthly_cloud_cost'] for a in wave_assets)

        wave_end = running_start + timedelta(weeks=wave_effort)

        wave_desc = {
            1: "Non-production environments — low risk, process validation",
            2: "Low-criticality production workloads — quick wins",
            3: "Mid-tier applications with managed dependency chains",
            4: "Business-critical applications requiring careful coordination",
            5: "Mission-critical systems, core databases, final cutover",
        }.get(wave_num, f"Wave {wave_num} migration")

        waves.append({
            'wave_number':       wave_num,
            'name':              f"Wave {wave_num}: {wave_desc.split('—')[0].strip()}",
            'description':       wave_desc,
            'assets':            wave_assets,
            'asset_count':       len(wave_assets),
            'start_date':        running_start.isoformat(),
            'end_date':          wave_end.isoformat(),
            'duration_weeks':    wave_effort,
            'migration_cost':    round(wave_cost, 2),
            'monthly_cloud_cost': round(wave_monthly, 2),
            'strategies_used':   list({a['strategy'] for a in wave_assets}),
            'risk_level':        _wave_risk(wave_assets),
            'key_risks':         _wave_risks(wave_assets),
            'success_criteria':  _wave_success_criteria(wave_num),
        })

        running_start = wave_end + timedelta(weeks=1)  # 1-week buffer between waves
        total_migration_cost += wave_cost
        total_monthly        += wave_monthly

    total_annual        = total_monthly * 12
    total_on_prem_est   = total_annual * 1.6
    total_savings       = total_on_prem_est - total_annual
    roi_months          = round(total_migration_cost / max(total_savings / 12, 1), 1)

    # 5. Overall security summary
    all_checks = []
    for a in assets:
        for c in a.get('security_checks', []):
            if c not in all_checks:
                all_checks.append(c)

    # 6. Architecture summary
    arch_summary = {}
    for a in assets:
        atype = a.get('asset_type', 'VM')
        arch_summary[atype] = arch_summary.get(atype, 0) + 1

    # 7. Executive summary
    total_weeks = sum(w['duration_weeks'] for w in waves) + len(waves)
    complexity_dist = {}
    for a in assets:
        c = a.get('complexity', 'medium')
        complexity_dist[c] = complexity_dist.get(c, 0) + 1

    return {
        'id':              str(uuid.uuid4())[:12],
        'project_name':    project_name,
        'provider':        provider,
        'generated_at':    datetime.now().isoformat(),
        'total_assets':    len(assets),
        'total_waves':     len(waves),
        'total_weeks':     total_weeks,
        'estimated_completion': (plan_start + timedelta(weeks=total_weeks)).isoformat(),
        'financials': {
            'total_migration_cost':   round(total_migration_cost, 2),
            'monthly_cloud_run_cost': round(total_monthly, 2),
            'annual_cloud_run_cost':  round(total_annual, 2),
            'estimated_on_prem_cost': round(total_on_prem_est, 2),
            'annual_savings':         round(total_savings, 2),
            'roi_months':             roi_months,
            'three_year_savings':     round(total_savings * 3 - total_migration_cost, 2),
        },
        'complexity_distribution': complexity_dist,
        'strategy_distribution': {s: sum(1 for a in assets if a.get('strategy_code') == s) for s in ('lift-shift', 'replatform', 'refactor')},
        'asset_type_distribution': arch_summary,
        'waves':           waves,
        'assets':          assets,
        'security_summary': {
            'total_checks':   len(all_checks),
            'all_checks':     all_checks[:20],
            'high_risk_assets': [a['name'] for a in assets if a.get('data_classification') in ('restricted', 'confidential')],
        },
        'executive_summary': _executive_summary(assets, waves, provider, total_migration_cost, roi_months),
    }


def _wave_risk(assets):
    crits = [CRITICALITY_ORDER.get(a.get('criticality','medium'), 1) for a in assets]
    avg   = sum(crits) / max(len(crits), 1)
    if avg >= 2.5: return 'high'
    if avg >= 1.5: return 'medium'
    return 'low'

def _wave_risks(assets):
    risks = []
    if any(a.get('complexity') in ('high','very-high') for a in assets):
        risks.append("High-complexity applications require extended testing")
    if any(a.get('data_classification') in ('restricted','confidential') for a in assets):
        risks.append("Sensitive data classification requires compliance sign-off")
    if any(len(a.get('dependencies','').split(',')) > 3 for a in assets):
        risks.append("Multiple upstream dependencies — coordinate parallel cutover")
    if any(a.get('internet_facing') for a in assets):
        risks.append("Internet-facing services require security hardening before go-live")
    if not risks:
        risks.append("Low overall risk — standard migration controls apply")
    return risks[:3]

def _wave_success_criteria(wave_num):
    base = [
        "All services passing health checks",
        "Performance within 10% of baseline",
        "Zero critical security findings",
        "Rollback procedure validated",
    ]
    if wave_num >= 4:
        base += ["Zero data loss confirmed", "Business sign-off from application owners"]
    if wave_num == 5:
        base += ["Disaster recovery test completed", "SLA metrics meeting targets"]
    return base

def _executive_summary(assets, waves, provider, migration_cost, roi_months):
    strategies = [a.get('strategy','Rehost') for a in assets]
    most_common = max(set(strategies), key=strategies.count)
    return (
        f"Migration of {len(assets)} assets to {provider.upper()} across {len(waves)} waves. "
        f"Primary strategy: {most_common}. "
        f"Estimated total investment: ${migration_cost:,.0f}. "
        f"ROI break-even at {roi_months} months post-migration. "
        f"Highest-risk wave: Wave {max(waves, key=lambda w: {'low':0,'medium':1,'high':2}[w['risk_level']])['wave_number']} "
        f"({max(waves, key=lambda w: {'low':0,'medium':1,'high':2}[w['risk_level']])['name']})."
    )
