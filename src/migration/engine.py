"""Migration planning and execution engine"""
from typing import Dict, List
from datetime import datetime, timedelta
from enum import Enum

class MigrationStrategy(Enum):
    """Migration strategies"""
    LIFT_SHIFT  = 'lift-shift'
    REPLATFORM  = 'replatform'
    REFACTOR    = 'refactor'
    REPURCHASE  = 'repurchase'
    RETIRE      = 'retire'

class MigrationEngine:
    """Core migration planning engine"""

    def __init__(self):
        self.effort_multipliers = {
            'lift-shift':  1.0,
            'replatform':  1.5,
            'refactor':    2.5,
            'repurchase':  1.2,
            'retire':      0.3,
        }

    def recommend_migration_strategy(self, application_data: Dict) -> str:
        """Recommend migration strategy based on application characteristics"""
        complexity         = application_data.get('complexity_level', 'medium')
        modernization_need = application_data.get('modernization_need', False)
        cloud_native       = application_data.get('is_cloud_native', False)
        eol_status         = application_data.get('end_of_life', False)

        if eol_status:
            return MigrationStrategy.RETIRE.value
        if not modernization_need and not cloud_native:
            return MigrationStrategy.LIFT_SHIFT.value
        if modernization_need and complexity in ('medium', 'high'):
            return MigrationStrategy.REFACTOR.value
        if complexity == 'high' and not cloud_native:
            return MigrationStrategy.REPLATFORM.value
        return MigrationStrategy.REPLATFORM.value

    def estimate_migration_effort(self, application_data: Dict, strategy: str) -> Dict:
        """Estimate effort for migration"""
        base_effort_weeks  = self._calculate_base_effort(application_data)
        multiplier         = self.effort_multipliers.get(strategy, 1.0)
        total_effort_weeks = base_effort_weeks * multiplier
        team_size          = self._estimate_team_size(total_effort_weeks)
        cost_per_pw        = 50_000 / 13
        total_cost         = int(total_effort_weeks * team_size * cost_per_pw)

        return {
            'effort_weeks':   int(total_effort_weeks),
            'team_size':      team_size,
            'estimated_cost': total_cost,
            'risk_level':     self._assess_effort_risk(total_effort_weeks),
        }

    def _calculate_base_effort(self, app_data: Dict) -> float:
        """Calculate base effort in weeks"""
        base_effort = 2.0

        db_size_gb = app_data.get('database_size_gb', 0)
        if db_size_gb > 0:
            base_effort += min(db_size_gb / 100, 4)

        storage_size_gb = app_data.get('storage_size_gb', 0)
        if storage_size_gb > 0:
            base_effort += min(storage_size_gb / 500, 3)

        complexity_effort = {'low': 1, 'medium': 2, 'high': 4, 'very-high': 8}
        base_effort += complexity_effort.get(app_data.get('complexity_level', 'medium'), 2)

        dependencies = app_data.get('dependencies', [])
        base_effort += len(dependencies) * 0.5

        return base_effort

    def _estimate_team_size(self, effort_weeks: float) -> int:
        """Estimate team size needed"""
        if effort_weeks <= 4:   return 1
        if effort_weeks <= 8:   return 2
        if effort_weeks <= 16:  return 3
        if effort_weeks <= 32:  return 4
        return 5

    def _assess_effort_risk(self, effort_weeks: float) -> str:
        """Assess risk based on effort"""
        if effort_weeks <= 4:   return 'low'
        if effort_weeks <= 12:  return 'medium'
        if effort_weeks <= 24:  return 'high'
        return 'very-high'

    def create_migration_plan(self, project_data: Dict, applications: List[Dict]) -> Dict:
        """Create detailed migration plan with waves"""
        sorted_apps = self._prioritize_applications(applications)
        waves       = self._create_waves(sorted_apps)
        timeline    = self._calculate_timeline(waves)

        return {
            'waves':                waves,
            'total_duration_weeks': timeline['total_weeks'],
            'total_duration_months': timeline['total_months'],
            'start_date':           datetime.now().isoformat(),
            'estimated_completion': (datetime.now() + timedelta(weeks=timeline['total_weeks'])).isoformat(),
            'total_estimated_cost': sum(w.get('cost', 0) for w in waves),
            'risk_assessment':      timeline['risk_level'],
        }

    def _prioritize_applications(self, applications: List[Dict]) -> List[Dict]:
        """Prioritize applications for migration (low-criticality first)"""
        priority_map = {'low': 0, 'medium': 1, 'high': 2, 'critical': 3}

        return sorted(
            applications,
            key=lambda a: (
                priority_map.get(a.get('criticality', 'medium'), 1),
                priority_map.get(a.get('complexity_level', 'medium'), 1),
            )
        )

    def _create_waves(self, applications: List[Dict], max_apps_per_wave: int = 5) -> List[Dict]:
        """Group applications into migration waves"""
        waves = []
        for wave_number, i in enumerate(range(0, len(applications), max_apps_per_wave), start=1):
            wave_apps = applications[i:i + max_apps_per_wave]
            efforts   = [
                self.estimate_migration_effort(a, self.recommend_migration_strategy(a))
                for a in wave_apps
            ]
            waves.append({
                'wave_number':        wave_number,
                'applications':       [a.get('name') for a in wave_apps],
                'app_count':          len(wave_apps),
                'total_effort_weeks': sum(e['effort_weeks']   for e in efforts),
                'cost':               sum(e['estimated_cost'] for e in efforts),
            })
        return waves

    def _calculate_timeline(self, waves: List[Dict]) -> Dict:
        """Calculate overall timeline for migration"""
        total_effort = sum(w.get('total_effort_weeks', 0) for w in waves)
        total_weeks  = int(total_effort * 1.2)  # 20% buffer
        total_months = int(total_weeks / 4.33)

        if total_effort <= 12:   risk_level = 'low'
        elif total_effort <= 24: risk_level = 'medium'
        elif total_effort <= 48: risk_level = 'high'
        else:                    risk_level = 'very-high'

        return {
            'total_weeks':  total_weeks,
            'total_months': total_months,
            'risk_level':   risk_level,
        }
