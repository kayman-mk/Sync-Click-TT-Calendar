import { TeamLead } from '../../../src/domain/model/TeamLead';

describe('TeamLead', () => {
    it('should_create_team_lead_with_name_surname_and_team_name', () => {
        const lead = new TeamLead('John', 'Smith', 'SC Klecken I');

        expect(lead.name).toBe('John');
        expect(lead.surname).toBe('Smith');
        expect(lead.teamName).toBe('SC Klecken I');
    });

    it('should_return_full_name_when_getFullName_is_called', () => {
        const lead = new TeamLead('Maria', 'Mueller', 'SC Klecken II');

        const fullName = lead.getFullName();

        expect(fullName).toBe('Maria Mueller');
    });

    it('should_return_full_name_with_special_characters', () => {
        const lead = new TeamLead('Jean-Pierre', 'Müller-König', 'Team A');

        const fullName = lead.getFullName();

        expect(fullName).toBe('Jean-Pierre Müller-König');
    });
});

