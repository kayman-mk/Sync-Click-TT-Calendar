import { injectable, inject } from "inversify";
import { TeamLead } from "../../domain/model/TeamLead";
import { TeamLeadRepository } from "../../domain/service/TeamLeadRepository";
import { SERVICE_IDENTIFIER } from "../../dependency_injection";
import { FileStorageService } from "../../domain/service/FileStorageService";

/**
 * File-based implementation of TeamLeadRepository.
 * Stores team leads in a local JSON file.
 */
@injectable()
export class FileTeamLeadRepositoryImpl implements TeamLeadRepository {
    private readonly fileName = "team_leads.json";

    constructor(
        @inject(SERVICE_IDENTIFIER.FileStorageService) private readonly fileStorageService: FileStorageService
    ) {}

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
            // FileStorageService.readFile returns a string
            const data = JSON.parse(content);
            // Convert plain objects to TeamLead instances
            return data.map((item: any) => new TeamLead(item.name, item.surname, item.teamName));
        } catch (err: any) {
            if (err && (err.code === 'ENOENT' || err.message?.includes('not found'))) {
                return [];
            }
            console.error('Error reading team leads file:', err);
            throw err;
        }
    }
}

