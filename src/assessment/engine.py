"""Assessment engine for cloud readiness evaluation"""
from enum import Enum
from typing import Dict, List, Tuple

class ReadinessLevel(Enum):
    """Readiness level enumeration"""
    CRITICAL  = (0,  20)
    LOW       = (21, 40)
    MODERATE  = (41, 60)
    GOOD      = (61, 80)
    EXCELLENT = (81, 100)

class AssessmentEngine:
    """Core assessment engine for cloud readiness"""

    def __init__(self):
        self.weights = {
            'business_readiness':       0.25,
            'technical_readiness':      0.25,
            'organizational_readiness': 0.25,
            'security_compliance':      0.25,
        }

    def assess_business_readiness(self, data: Dict) -> Tuple[int, List[str], List[str]]:
        """Assess business readiness (0-100)"""
        score = 0
        recommendations: List[str] = []
        risks: List[str] = []

        if data.get('has_executive_sponsor'):
            score += 25
        else:
            recommendations.append('Secure executive sponsorship and C-level support')
            risks.append('Lack of executive support can lead to project failure')

        if data.get('clear_business_objectives'):
            score += 20
        else:
            recommendations.append('Define clear, measurable business objectives')

        if data.get('budget_allocated') and data.get('budget_approved'):
            score += 20
        else:
            recommendations.append('Allocate and secure budget approval')
            risks.append('Budget constraints may delay migration')

        if data.get('resources_committed'):
            score += 20
        else:
            recommendations.append('Commit necessary resources for migration')

        if data.get('realistic_timeline'):
            score += 15
        else:
            recommendations.append('Create realistic migration timeline')

        return min(score, 100), recommendations, risks

    def assess_technical_readiness(self, data: Dict) -> Tuple[int, List[str], List[str]]:
        """Assess technical readiness (0-100)"""
        score = 0
        recommendations: List[str] = []
        risks: List[str] = []

        app_complexity = data.get('application_complexity', 'unknown')
        if app_complexity == 'microservices':
            score += 25
        elif app_complexity == 'monolithic':
            score += 10
            recommendations.append('Consider breaking down monolithic applications')
        else:
            recommendations.append('Analyze and document application architecture')

        if data.get('has_cloud_ready_infrastructure'):
            score += 25
        else:
            recommendations.append('Update infrastructure to cloud-ready standards')
            risks.append('Legacy infrastructure may hinder cloud adoption')

        integration_count = data.get('integration_count', 0)
        if integration_count <= 5:
            score += 20
        elif integration_count <= 15:
            score += 10
            recommendations.append(f'Plan for {integration_count} integrations')
        else:
            risks.append(f'High integration complexity ({integration_count})')

        data_size_tb = data.get('data_size_tb', 0)
        if data_size_tb <= 1:
            score += 20
        elif data_size_tb <= 10:
            score += 12
        else:
            risks.append(f'Large data volume ({data_size_tb}TB)')

        if not data.get('has_legacy_systems', False):
            score += 10
        else:
            risks.append('Legacy system dependencies increase complexity')

        return min(score, 100), recommendations, risks

    def assess_organizational_readiness(self, data: Dict) -> Tuple[int, List[str], List[str]]:
        """Assess organizational readiness (0-100)"""
        score = 0
        recommendations: List[str] = []
        risks: List[str] = []

        cloud_skills = data.get('team_cloud_skills_level', 'none')
        if cloud_skills == 'advanced':
            score += 25
        elif cloud_skills == 'intermediate':
            score += 18
        elif cloud_skills == 'basic':
            score += 10
            recommendations.append('Provide cloud certification training')
        else:
            recommendations.append('Conduct comprehensive cloud skills training')
            risks.append('Lack of cloud expertise may impact migration')

        if data.get('training_plan_exists'):
            score += 20
        else:
            recommendations.append('Develop comprehensive training plan')

        if data.get('change_management_plan_exists'):
            score += 20
        else:
            recommendations.append('Create change management and communication plan')
            risks.append('Poor change management affects adoption')

        if data.get('vendor_partnerships_established'):
            score += 20
        else:
            recommendations.append('Establish partnerships with cloud vendors')

        if data.get('governance_framework_exists'):
            score += 15
        else:
            recommendations.append('Define cloud governance framework and policies')

        return min(score, 100), recommendations, risks

    def assess_security_compliance(self, data: Dict) -> Tuple[int, List[str], List[str]]:
        """Assess security and compliance readiness (0-100)"""
        score = 0
        recommendations: List[str] = []
        risks: List[str] = []

        if data.get('compliance_requirements_documented'):
            score += 20
        else:
            recommendations.append('Document all compliance requirements')
            risks.append('Compliance gaps expose to legal issues')

        if data.get('security_policies_in_place'):
            score += 20
        else:
            recommendations.append('Establish comprehensive security policies')
            risks.append('Missing policies increase breach risk')

        if data.get('data_privacy_framework_exists'):
            score += 20
        else:
            recommendations.append('Implement data privacy framework')

        if data.get('encryption_standards_defined'):
            score += 20
        else:
            recommendations.append('Define encryption standards')
            risks.append('Unencrypted data increases security risk')

        if data.get('audit_logging_capability'):
            score += 20
        else:
            recommendations.append('Establish centralized audit logging')

        return min(score, 100), recommendations, risks

    def calculate_overall_readiness(self, business: int, technical: int,
                                    organizational: int, security: int) -> int:
        """Calculate weighted overall readiness score"""
        total = (
            business      * self.weights['business_readiness'] +
            technical     * self.weights['technical_readiness'] +
            organizational * self.weights['organizational_readiness'] +
            security      * self.weights['security_compliance']
        )
        return int(total)

    def get_readiness_level(self, score: int) -> str:
        """Get readiness level based on score"""
        for level in ReadinessLevel:
            if level.value[0] <= score <= level.value[1]:
                return level.name
        return 'UNKNOWN'

    def generate_report(self, assessment_data: Dict) -> Dict:
        """Generate comprehensive assessment report"""
        business_score, business_recs, business_risks = self.assess_business_readiness(
            assessment_data.get('business', {})
        )
        technical_score, technical_recs, technical_risks = self.assess_technical_readiness(
            assessment_data.get('technical', {})
        )
        org_score, org_recs, org_risks = self.assess_organizational_readiness(
            assessment_data.get('organizational', {})
        )
        security_score, security_recs, security_risks = self.assess_security_compliance(
            assessment_data.get('security', {})
        )

        overall_score = self.calculate_overall_readiness(
            business_score, technical_score, org_score, security_score
        )

        return {
            'scores': {
                'business_readiness':       business_score,
                'technical_readiness':      technical_score,
                'organizational_readiness': org_score,
                'security_compliance':      security_score,
                'overall_score':            overall_score,
            },
            'readiness_level': self.get_readiness_level(overall_score),
            'recommendations': {
                'business':      business_recs,
                'technical':     technical_recs,
                'organizational': org_recs,
                'security':      security_recs,
            },
            'risks': {
                'business':      business_risks,
                'technical':     technical_risks,
                'organizational': org_risks,
                'security':      security_risks,
            },
        }
