"""Tests for Migration Engine"""
import pytest
from src.migration.engine import MigrationEngine, MigrationStrategy

class TestMigrationEngine:
    """Migration engine tests"""

    @pytest.fixture
    def engine(self):
        return MigrationEngine()

    def test_recommend_migration_strategy_retire(self, engine):
        """EOL apps should be retired"""
        strategy = engine.recommend_migration_strategy({'end_of_life': True})
        assert strategy == MigrationStrategy.RETIRE.value

    def test_recommend_migration_strategy_lift_shift(self, engine):
        """Apps needing no modernisation → lift-shift"""
        app_data = {'end_of_life': False, 'modernization_need': False, 'is_cloud_native': False}
        strategy = engine.recommend_migration_strategy(app_data)
        assert strategy == MigrationStrategy.LIFT_SHIFT.value

    def test_estimate_migration_effort(self, engine):
        """Effort estimation returns expected keys and positive values"""
        app_data = {
            'database_size_gb': 100,
            'storage_size_gb': 500,
            'complexity_level': 'medium',
            'dependencies': ['app1', 'app2'],
        }
        result = engine.estimate_migration_effort(app_data, 'lift-shift')
        assert 'effort_weeks'   in result
        assert 'team_size'      in result
        assert 'estimated_cost' in result
        assert result['effort_weeks'] > 0
