"""Tests for Assessment Engine"""
import pytest
from src.assessment.engine import AssessmentEngine

class TestAssessmentEngine:
    """Assessment engine tests"""

    @pytest.fixture
    def engine(self):
        return AssessmentEngine()

    def test_assess_business_readiness(self, engine):
        """Test business readiness assessment — all criteria met"""
        data = {
            'has_executive_sponsor': True,
            'clear_business_objectives': True,
            'budget_allocated': True,
            'budget_approved': True,
            'resources_committed': True,
            'realistic_timeline': True,
        }
        score, recommendations, risks = engine.assess_business_readiness(data)
        assert score == 100
        assert len(recommendations) == 0
        assert len(risks) == 0

    def test_calculate_overall_readiness(self, engine):
        """Test overall readiness calculation"""
        score = engine.calculate_overall_readiness(75, 70, 80, 65)
        assert score == 72

    def test_get_readiness_level(self, engine):
        """Test readiness level classification"""
        assert engine.get_readiness_level(10)  == 'CRITICAL'
        assert engine.get_readiness_level(30)  == 'LOW'
        assert engine.get_readiness_level(50)  == 'MODERATE'
        assert engine.get_readiness_level(70)  == 'GOOD'
        assert engine.get_readiness_level(90)  == 'EXCELLENT'
