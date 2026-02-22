import { FileTeamLeadRepositoryImpl } from '../../../src/adapter/service/FileTeamLeadRepositoryImpl';
import { LocalFileStorageServiceImpl } from '../../../src/adapter/service/LocalFileStorageServiceImpl';
import { TeamLead } from '../../../src/domain/model/TeamLead';
import { TeamLeadRepository } from '../../../src/domain/service/TeamLeadRepository';
import * as fs from 'fs';
import * as path from 'path';

// Custom implementation for testing with a different filename (read-only)
class TestFileTeamLeadRepositoryImpl implements TeamLeadRepository {
    private readonly fileName = 'test_team_leads.json';

    constructor(private readonly fileStorageService: LocalFileStorageServiceImpl) {}

    async findByTeamName(teamName: string): Promise<TeamLead | undefined> {
        const teamLeads = await this.getAll();
        return teamLeads.find(lead => lead.teamName === teamName);
    }

    async findByName(name: string, surname: string): Promise<TeamLead | undefined> {
        const teamLeads = await this.getAll();
        return teamLeads.find(lead => lead.name === name && lead.surname === surname);
    }

    async getAll(): Promise<TeamLead[]> {
        try {
            const content = await this.fileStorageService.readFile(this.fileName);
            const data = JSON.parse(content);
            return data.map((item: any) => new TeamLead(item.name, item.surname, item.teamName));
        } catch (err: any) {
            if (err && (err.code === 'ENOENT' || err.message?.includes('not found'))) {
                return [];
            }
            console.error('Error reading test team leads file:', err);
            throw err;
        }
    }
}

describe('FileTeamLeadRepositoryImpl InfraTest', () => {
    let repo: TestFileTeamLeadRepositoryImpl;
    let storageService: LocalFileStorageServiceImpl;
    const testDataDir = path.join(__dirname, '../../../target/test-data');
    const testFilePath = path.join(testDataDir, 'test_team_leads.json');
    const originalCwd = process.cwd();

    beforeEach(() => {
        // Create test directory if it doesn't exist
        if (!fs.existsSync(testDataDir)) {
            fs.mkdirSync(testDataDir, { recursive: true });
        }

        // Create storage service
        storageService = new LocalFileStorageServiceImpl();

        // Change to test directory
        process.chdir(testDataDir);
        repo = new TestFileTeamLeadRepositoryImpl(storageService);
    });

    afterEach(() => {
        // Restore original directory
        process.chdir(originalCwd);

        // Clean up test files
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
    });

    it('should_retrieve_team_leads_from_file', async () => {
        // Create test file with sample data
        const sampleData = [
            { name: 'John', surname: 'Smith', teamName: 'SC Klecken I' },
            { name: 'Maria', surname: 'Mueller', teamName: 'SC Klecken II' },
        ];
        fs.writeFileSync(testFilePath, JSON.stringify(sampleData, null, 2));

        const result = await repo.getAll();

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('John');
        expect(result[1].name).toBe('Maria');
    });

    it('should_find_team_lead_by_team_name', async () => {
        // Create test file with sample data
        const sampleData = [
            { name: 'John', surname: 'Smith', teamName: 'SC Klecken I' },
            { name: 'Maria', surname: 'Mueller', teamName: 'SC Klecken II' },
        ];
        fs.writeFileSync(testFilePath, JSON.stringify(sampleData, null, 2));

        const result = await repo.findByTeamName('SC Klecken II');

        expect(result).toBeDefined();
        expect(result?.name).toBe('Maria');
        expect(result?.surname).toBe('Mueller');
    });

    it('should_find_team_lead_by_name_and_surname', async () => {
        // Create test file with sample data
        const sampleData = [
            { name: 'Michael', surname: 'Schneider', teamName: 'Jugend M12' },
            { name: 'Anna', surname: 'Weber', teamName: 'Jugend W12' },
        ];
        fs.writeFileSync(testFilePath, JSON.stringify(sampleData, null, 2));

        const result = await repo.findByName('Anna', 'Weber');

        expect(result).toBeDefined();
        expect(result?.teamName).toBe('Jugend W12');
        expect(result?.getFullName()).toBe('Anna Weber');
    });

    it('should_return_empty_array_when_file_not_found', async () => {
        // Don't create the test file

        const result = await repo.getAll();

        expect(result).toEqual([]);
    });

    it('should_return_undefined_when_team_lead_not_found', async () => {
        // Create test file with sample data
        const sampleData = [
            { name: 'John', surname: 'Smith', teamName: 'SC Klecken I' },
        ];
        fs.writeFileSync(testFilePath, JSON.stringify(sampleData, null, 2));

        const result = await repo.findByTeamName('Non Existent Team');

        expect(result).toBeUndefined();
    });
});

