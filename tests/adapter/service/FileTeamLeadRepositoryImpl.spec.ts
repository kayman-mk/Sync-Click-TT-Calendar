import { FileTeamLeadRepositoryImpl } from '../../../src/adapter/service/FileTeamLeadRepositoryImpl';
import { FileStorageService } from '../../../src/domain/service/FileStorageService';
import { TeamLead } from '../../../src/domain/model/TeamLead';

// Mocks
const mockFileStorageService: FileStorageService = {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    deleteFile: jest.fn(),
};

describe('FileTeamLeadRepositoryImpl', () => {
    let repo: FileTeamLeadRepositoryImpl;
    const teamLead1 = new TeamLead('John', 'Smith', 'SC Klecken I');
    const teamLead2 = new TeamLead('Maria', 'Mueller', 'SC Klecken II');

    beforeEach(() => {
        jest.clearAllMocks();
        repo = new FileTeamLeadRepositoryImpl(mockFileStorageService);
    });

    describe('findByTeamName', () => {
        it('should_return_team_lead_when_found_by_team_name', async () => {
            const teamLeads = [teamLead1, teamLead2];
            (mockFileStorageService.readFile as jest.Mock).mockResolvedValue(
                JSON.stringify(teamLeads)
            );

            const result = await repo.findByTeamName('SC Klecken I');

            expect(result).toBeDefined();
            expect(result?.name).toBe('John');
            expect(result?.surname).toBe('Smith');
            expect(result?.teamName).toBe('SC Klecken I');
        });

        it('should_return_undefined_when_team_lead_not_found_by_team_name', async () => {
            const teamLeads = [teamLead1, teamLead2];
            (mockFileStorageService.readFile as jest.Mock).mockResolvedValue(
                JSON.stringify(teamLeads)
            );

            const result = await repo.findByTeamName('Non Existent Team');

            expect(result).toBeUndefined();
        });

        it('should_return_undefined_when_file_not_found', async () => {
            (mockFileStorageService.readFile as jest.Mock).mockRejectedValue({
                code: 'ENOENT',
            });

            const result = await repo.findByTeamName('SC Klecken I');

            expect(result).toBeUndefined();
        });
    });

    describe('findByName', () => {
        it('should_return_team_lead_when_found_by_name_and_surname', async () => {
            const teamLeads = [teamLead1, teamLead2];
            (mockFileStorageService.readFile as jest.Mock).mockResolvedValue(
                JSON.stringify(teamLeads)
            );

            const result = await repo.findByName('Maria', 'Mueller');

            expect(result).toBeDefined();
            expect(result?.name).toBe('Maria');
            expect(result?.surname).toBe('Mueller');
            expect(result?.teamName).toBe('SC Klecken II');
        });

        it('should_return_undefined_when_team_lead_not_found_by_name', async () => {
            const teamLeads = [teamLead1, teamLead2];
            (mockFileStorageService.readFile as jest.Mock).mockResolvedValue(
                JSON.stringify(teamLeads)
            );

            const result = await repo.findByName('Unknown', 'Person');

            expect(result).toBeUndefined();
        });

        it('should_return_undefined_when_file_not_found', async () => {
            (mockFileStorageService.readFile as jest.Mock).mockRejectedValue({
                code: 'ENOENT',
            });

            const result = await repo.findByName('John', 'Smith');

            expect(result).toBeUndefined();
        });
    });


    describe('getAll', () => {
        it('should_return_all_team_leads', async () => {
            const teamLeads = [teamLead1, teamLead2];
            (mockFileStorageService.readFile as jest.Mock).mockResolvedValue(
                JSON.stringify(teamLeads)
            );

            const result = await repo.getAll();

            expect(result).toHaveLength(2);
            expect(result[0].name).toBe('John');
            expect(result[1].name).toBe('Maria');
        });

        it('should_return_empty_array_when_file_not_found', async () => {
            (mockFileStorageService.readFile as jest.Mock).mockRejectedValue({
                code: 'ENOENT',
            });

            const result = await repo.getAll();

            expect(result).toEqual([]);
        });

        it('should_return_empty_array_when_file_has_not_found_message', async () => {
            (mockFileStorageService.readFile as jest.Mock).mockRejectedValue(
                new Error('File not found')
            );

            const result = await repo.getAll();

            expect(result).toEqual([]);
        });

        it('should_throw_error_on_other_read_errors', async () => {
            (mockFileStorageService.readFile as jest.Mock).mockRejectedValue(
                new Error('Permission denied')
            );

            await expect(repo.getAll()).rejects.toThrow('Permission denied');
        });

        it('should_convert_plain_objects_to_team_lead_instances', async () => {
            const plainObjects = [
                { name: 'John', surname: 'Smith', teamName: 'SC Klecken I' },
                { name: 'Maria', surname: 'Mueller', teamName: 'SC Klecken II' },
            ];
            (mockFileStorageService.readFile as jest.Mock).mockResolvedValue(
                JSON.stringify(plainObjects)
            );

            const result = await repo.getAll();

            expect(result[0]).toBeInstanceOf(TeamLead);
            expect(result[1]).toBeInstanceOf(TeamLead);
            expect(result[0].getFullName()).toBe('John Smith');
            expect(result[1].getFullName()).toBe('Maria Mueller');
        });
    });
});

