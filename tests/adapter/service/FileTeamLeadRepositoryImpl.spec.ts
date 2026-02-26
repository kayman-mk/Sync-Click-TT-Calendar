import { FileTeamLeadRepositoryImpl } from '../../../src/adapter/service/FileTeamLeadRepositoryImpl';
import { FileStorageService } from '../../../src/domain/service/FileStorageService';
import { TeamLead } from '../../../src/domain/model/TeamLead';
import { MockLogger } from '../../test-utils/MockLogger';

// Mocks
const mockFileStorageService: FileStorageService = {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    deleteFile: jest.fn(),
};
const mockLogger = new MockLogger();

describe('FileTeamLeadRepositoryImpl', () => {
    let repo: FileTeamLeadRepositoryImpl;

    beforeEach(() => {
        jest.clearAllMocks();
        repo = new FileTeamLeadRepositoryImpl('/test/path/team_leads.json', mockFileStorageService, mockLogger);
    });


    describe('findByTeamNameAndAgeClass', () => {
        it('should_return_team_lead_when_found_by_team_name_age_class_and_runde', async () => {
            const groupedData = {
                VR: [
                    { fullName: 'John Smith', teamName: 'SC Kleckersdorf I', ageClass: 'Herren', email: 'john.smith@example.com' },
                    { fullName: 'Maria Mueller', teamName: 'SC Kleckersdorf II', ageClass: 'Damen', email: 'maria.mueller@example.com' },
                ],
                RR: [
                    { fullName: 'John Smith', teamName: 'SC Kleckersdorf I', ageClass: 'Herren', email: 'john.smith@example.com' },
                    { fullName: 'Maria Mueller', teamName: 'SC Kleckersdorf II', ageClass: 'Damen', email: 'maria.mueller@example.com' },
                ]
            };
            (mockFileStorageService.readFile as jest.Mock).mockResolvedValue(
                JSON.stringify(groupedData)
            );

            const result = await repo.findByTeamNameAndAgeClass('SC Kleckersdorf I', 'Herren', 'VR');

            expect(result).toBeDefined();
            expect(result?.fullName).toBe('John Smith');
            expect(result?.ageClass).toBe('Herren');
            expect(result?.runde).toBe('VR');
            expect(result?.email).toBe('john.smith@example.com');
        });

        it('should_return_team_lead_from_RR_when_searching_in_RR', async () => {
            const groupedData = {
                VR: [
                    { fullName: 'John Smith 1', teamName: 'SC Kleckersdorf I', ageClass: 'Herren' },
                ],
                RR: [
                    { fullName: 'John Smith', teamName: 'SC Kleckersdorf I', ageClass: 'Herren' },
                ]
            };
            (mockFileStorageService.readFile as jest.Mock).mockResolvedValue(
                JSON.stringify(groupedData)
            );

            const result = await repo.findByTeamNameAndAgeClass('SC Kleckersdorf I', 'Herren', 'RR');

            expect(result).toBeDefined();
            expect(result?.runde).toBe('RR');
        });

        it('should_return_undefined_when_team_name_matches_but_age_class_does_not', async () => {
            const groupedData = {
                VR: [
                    { fullName: 'John Smith', teamName: 'SC Kleckersdorf I', ageClass: 'Herren' },
                ]
            };
            (mockFileStorageService.readFile as jest.Mock).mockResolvedValue(
                JSON.stringify(groupedData)
            );

            const result = await repo.findByTeamNameAndAgeClass('SC Kleckersdorf I', 'Damen', 'VR');

            expect(result).toBeUndefined();
        });

        it('should_return_undefined_when_neither_team_name_nor_age_class_match', async () => {
            const groupedData = {
                VR: [
                    { fullName: 'John Smith', teamName: 'SC Kleckersdorf I', ageClass: 'Herren' },
                ]
            };
            (mockFileStorageService.readFile as jest.Mock).mockResolvedValue(
                JSON.stringify(groupedData)
            );

            const result = await repo.findByTeamNameAndAgeClass('Non Existent Team', 'Herren', 'VR');

            expect(result).toBeUndefined();
        });

        it('should_return_undefined_when_runde_does_not_exist', async () => {
            const groupedData = {
                VR: [
                    { fullName: 'John Smith', teamName: 'SC Kleckersdorf I', ageClass: 'Herren' },
                ]
            };
            (mockFileStorageService.readFile as jest.Mock).mockResolvedValue(
                JSON.stringify(groupedData)
            );

            const result = await repo.findByTeamNameAndAgeClass('SC Kleckersdorf I', 'Herren', 'NonExistent');

            expect(result).toBeUndefined();
        });
    });

    describe('findByName', () => {
        it('should_return_team_lead_when_found_by_full_name_and_runde', async () => {
            const groupedData = {
                VR: [
                    { fullName: 'John Smith', teamName: 'SC Kleckersdorf I', ageClass: 'Herren' },
                    { fullName: 'Maria Mueller', teamName: 'SC Kleckersdorf II', ageClass: 'Damen' },
                ],
                RR: [
                    { fullName: 'John Smith 1', teamName: 'SC Kleckersdorf I', ageClass: 'Herren' },
                ]
            };
            (mockFileStorageService.readFile as jest.Mock).mockResolvedValue(
                JSON.stringify(groupedData)
            );

            const result = await repo.findByName('Maria Mueller', 'VR');

            expect(result).toBeDefined();
            expect(result?.fullName).toBe('Maria Mueller');
            expect(result?.teamName).toBe('SC Kleckersdorf II');
            expect(result?.runde).toBe('VR');
        });

        it('should_return_undefined_when_team_lead_not_found_by_name', async () => {
            const groupedData = {
                VR: [
                    { fullName: 'John Smith', teamName: 'SC Kleckersdorf I', ageClass: 'Herren' },
                ]
            };
            (mockFileStorageService.readFile as jest.Mock).mockResolvedValue(
                JSON.stringify(groupedData)
            );

            const result = await repo.findByName('Unknown Person', 'VR');

            expect(result).toBeUndefined();
        });
    });


    describe('getAllByRunde', () => {
        it('should_return_all_team_leads_for_vr_runde', async () => {
            const groupedData = {
                VR: [
                    { fullName: 'John Smith', teamName: 'SC Kleckersdorf I', ageClass: 'Herren', email: 'john.smith@example.com' },
                    { fullName: 'Maria Mueller', teamName: 'SC Kleckersdorf II', ageClass: 'Damen', email: 'maria.mueller@example.com' },
                ],
                RR: [
                    { fullName: 'John Smith 1', teamName: 'SC Kleckersdorf I', ageClass: 'Herren', email: 'john.smith@example.com' },
                ]
            };
            (mockFileStorageService.readFile as jest.Mock).mockResolvedValue(
                JSON.stringify(groupedData)
            );

            const result = await repo.getAllByRunde('VR');

            expect(result).toHaveLength(2);
            expect(result[0].fullName).toBe('John Smith');
            expect(result[1].fullName).toBe('Maria Mueller');
            expect(result[0].runde).toBe('VR');
            expect(result[1].runde).toBe('VR');
            expect(result[0].email).toBe('john.smith@example.com');
            expect(result[1].email).toBe('maria.mueller@example.com');
        });

        it('should_return_all_team_leads_for_rr_runde', async () => {
            const groupedData = {
                VR: [
                    { fullName: 'John Smith 1', teamName: 'SC Kleckersdorf I', ageClass: 'Herren', email: 'john.smith@example.com' },
                    { fullName: 'Maria Mueller', teamName: 'SC Kleckersdorf II', ageClass: 'Damen', email: 'maria.mueller@example.com' },
                ],
                RR: [
                    { fullName: 'John Smith', teamName: 'SC Kleckersdorf I', ageClass: 'Herren', email: 'john.smith@example.com' },
                ]
            };
            (mockFileStorageService.readFile as jest.Mock).mockResolvedValue(
                JSON.stringify(groupedData)
            );

            const result = await repo.getAllByRunde('RR');

            expect(result).toHaveLength(1);
            expect(result[0].fullName).toBe('John Smith');
            expect(result[0].runde).toBe('RR');
        });

        it('should_return_empty_array_when_runde_does_not_exist', async () => {
            const groupedData = {
                VR: [
                    { fullName: 'John Smith', teamName: 'SC Kleckersdorf I', ageClass: 'Herren' },
                ]
            };
            (mockFileStorageService.readFile as jest.Mock).mockResolvedValue(
                JSON.stringify(groupedData)
            );

            const result = await repo.getAllByRunde('NonExistent');

            expect(result).toEqual([]);
        });

        it('should_convert_plain_objects_to_team_lead_instances', async () => {
            const groupedData = {
                VR: [
                    { fullName: 'John Smith', teamName: 'SC Kleckersdorf I' },
                    { fullName: 'Maria Mueller', teamName: 'SC Kleckersdorf II' },
                ]
            };
            (mockFileStorageService.readFile as jest.Mock).mockResolvedValue(
                JSON.stringify(groupedData)
            );

            const result = await repo.getAllByRunde('VR');

            expect(result[0]).toBeInstanceOf(TeamLead);
            expect(result[1]).toBeInstanceOf(TeamLead);
            expect(result[0].fullName).toBe('John Smith');
            expect(result[1].fullName).toBe('Maria Mueller');
        });
    });
});

