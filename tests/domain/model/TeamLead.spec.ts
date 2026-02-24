import { TeamLead } from '../../../src/domain/model/TeamLead';

describe('TeamLead', () => {
    it('should_create_team_lead_with_full_name_team_name_and_age_class', () => {
        const lead = new TeamLead('John Smith', 'SC Kleckersdorf I', 'Herren');

        expect(lead.fullName).toBe('John Smith');
        expect(lead.teamName).toBe('SC Kleckersdorf I');
        expect(lead.ageClass).toBe('Herren');
    });

    it('should_create_team_lead_with_empty_age_class_as_default', () => {
        const lead = new TeamLead('Maria Mueller', 'SC Kleckersdorf II');

        expect(lead.fullName).toBe('Maria Mueller');
        expect(lead.teamName).toBe('SC Kleckersdorf II');
        expect(lead.ageClass).toBe('');
    });

    it('should_store_full_name_with_special_characters', () => {
        const lead = new TeamLead('Jean-Pierre Müller-König', 'Team A', 'mJ12');

        expect(lead.fullName).toBe('Jean-Pierre Müller-König');
    });

    it('should_create_team_lead_with_runde', () => {
        const lead = new TeamLead('John Smith', 'SC Kleckersdorf', '', 'VR');

        expect(lead.fullName).toBe('John Smith');
        expect(lead.runde).toBe('VR');
    });

    it('should_create_team_lead_with_email', () => {
        const lead = new TeamLead('John Smith', 'SC Kleckersdorf', 'Herren', 'VR', 'john.smith@example.com');

        expect(lead.fullName).toBe('John Smith');
        expect(lead.email).toBe('john.smith@example.com');
    });

    it('should_have_empty_email_as_default', () => {
        const lead = new TeamLead('Maria Mueller', 'SC Kleckersdorf II');

        expect(lead.email).toBe('');
    });
});

