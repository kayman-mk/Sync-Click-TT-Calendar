import { LocalDateTime } from "@js-joda/core"
import { ClickTtCsvFileAppointmentParserServiceImpl } from "../../../src/adapter/service/ClickTtCsvFileAppointmentParserServiceImpl"
import { FileStorageService } from "../../../src/domain/service/FileStorageService"
import { TeamLeadRepository } from "../../../src/domain/service/TeamLeadRepository"
import { TeamLead } from "../../../src/domain/model/TeamLead"
import { MockLogger } from "../../test-utils/MockLogger"

const defaultAppointments = `Termin;Staffel;Runde;HeimMannschaft;HalleStrasse;HalleOrt;HallePLZ;HalleName;GastVereinName;GastMannschaft;BegegnungNr;Altersklasse
10.10.2022 11:45;3. KK West;VR;VfL Hamburg;Lübecker Straße 4;Lübeck;23456;Holstenhalle;SC Lübeck;SC Lübeck III;2;Herren
11.10.2022 11:45;3. KK West;VR;VfL Hamburg;Lübecker Straße 4;Lübeck;23456;Holstenhalle;spielfrei;;2;Herren`

const emptyHalleAppointment = `Termin;Staffel;Runde;HeimMannschaft;HalleStrasse;HalleOrt;HallePLZ;HalleName;GastVereinName;GastMannschaft;BegegnungNr;Altersklasse
12.10.2022 11:45;3. KK West;VR;VfL Hamburg;;;;;SC Lübeck;SC Lübeck III;2;Herren`

class TestFileStorageService implements FileStorageService {
    constructor(private readonly fileContent: string) {}

    async readFile(filename: string): Promise<string> {
        return this.fileContent;
    }

    async writeFile(filename: string, content: string): Promise<void> {
        // No-op for tests
    }

    async deleteFile(filename: string): Promise<void> {
        // No-op for tests
    }
}

class TestTeamLeadRepository implements TeamLeadRepository {

    async findByTeamNameAndAgeClass(teamName: string, ageClass: string, runde: string): Promise<TeamLead | undefined> {
        return undefined; // Mock always returns undefined for tests
    }

    async findByName(fullName: string, runde: string): Promise<TeamLead | undefined> {
        return undefined;
    }

    async getAll(runde: string): Promise<TeamLead[]> {
        return [];
    }
}


describe('Parse Click-TT CSV file', () => {
    it('should create appointment from CSV data', () => {
        const parser = new ClickTtCsvFileAppointmentParserServiceImpl(new TestFileStorageService(defaultAppointments), new MockLogger(), new TestTeamLeadRepository(), "SC Kleckersdorf")

        // when
        parser.parseAppointments("abc.csv").then(actualAppointments => {
            // then
            expect(actualAppointments.size).toEqual(1);
        })
    })

    it('should ignore "spielfrei" appointments', () => {
        const parser = new ClickTtCsvFileAppointmentParserServiceImpl(new TestFileStorageService(defaultAppointments), new MockLogger(), new TestTeamLeadRepository(), "SC Kleckersdorf")

        // when
        parser.parseAppointments("abc.csv").then(actualAppointments => {
            // then
            expect(actualAppointments.size).toEqual(1);
        })
    })

    it('should show empty address if address fields are not filled', () => {
        const parser = new ClickTtCsvFileAppointmentParserServiceImpl(new TestFileStorageService(emptyHalleAppointment), new MockLogger(), new TestTeamLeadRepository(), "SC Kleckersdorf")

        // when
        parser.parseAppointments("abc.csv").then(actualAppointments => {
            const actualAppointment = actualAppointments.values().next().value

            // then
            expect(actualAppointment.location).toEqual("");
        })
    })

    it('should extract necessary data from CSV data', () => {
        const parser = new ClickTtCsvFileAppointmentParserServiceImpl(new TestFileStorageService(defaultAppointments), new MockLogger(), new TestTeamLeadRepository(), "SC Kleckersdorf")

        // when
        parser.parseAppointments("abc.csv").then(actualAppointments => {
            const actualAppointment = actualAppointments.values().next().value

            // then
            expect(actualAppointment.id).toEqual("3. KK West-2-VR-2022");
            expect(actualAppointment.ageClass).toEqual("Herren");
            expect(actualAppointment.categories).toEqual(["Click-TT", "Liga", "Jugend", "Herren"]);
            expect(actualAppointment.isCup).toEqual(false);
            expect(actualAppointment.location).toEqual("Holstenhalle, Lübecker Straße 4, 23456 Lübeck");
            expect(actualAppointment.startDateTime).toEqual(LocalDateTime.parse("2022-10-10T11:45"));
            expect(actualAppointment.title).toEqual("VfL Hamburg - SC Lübeck III [Herren]");
        })
    })

    it('should_parse_date_with_day_of_week_prefix_when_processing_german_date_format', () => {
        const csvWithDayOfWeek = `Termin;Staffel;Runde;HeimMannschaft;HalleStrasse;HalleOrt;HallePLZ;HalleName;GastVereinName;GastMannschaft;BegegnungNr;Altersklasse\nMo., 25.08.2025 20:15;3. KK West;VR;VfL Hamburg;Lübecker Straße 4;Lübeck;23456;Holstenhalle;SC Lübeck;SC Lübeck III;2;Herren`;
        const parser = new ClickTtCsvFileAppointmentParserServiceImpl(new TestFileStorageService(csvWithDayOfWeek), new MockLogger(), new TestTeamLeadRepository(), "SC Kleckersdorf")
        parser.parseAppointments("abc.csv").then(actualAppointments => {
            const actualAppointment = actualAppointments.values().next().value
            expect(actualAppointment.startDateTime).toEqual(LocalDateTime.parse("2025-08-25T20:15"));
        })
    });

    it('should_strip_trailing_v_character_when_appointment_was_moved', () => {
        const csvWithTrailingV = `Termin;Staffel;Runde;HeimMannschaft;HalleStrasse;HalleOrt;HallePLZ;HalleName;GastVereinName;GastMannschaft;BegegnungNr;Altersklasse\n16.09.2025 20:30v;3. KK West;VR;VfL Hamburg;Lübecker Straße 4;Lübeck;23456;Holstenhalle;SC Lübeck;SC Lübeck III;2;Herren`;
        const parser = new ClickTtCsvFileAppointmentParserServiceImpl(new TestFileStorageService(csvWithTrailingV), new MockLogger(), new TestTeamLeadRepository(), "SC Kleckersdorf")
        parser.parseAppointments("abc.csv").then(actualAppointments => {
            const actualAppointment = actualAppointments.values().next().value
            expect(actualAppointment.startDateTime).toEqual(LocalDateTime.parse("2025-09-16T20:30"));
        })
    });

    it('should_handle_malformed_date_time_gracefully', () => {
        const csvMalformed = `Termin;Staffel;Runde;HeimMannschaft;HalleStrasse;HalleOrt;HallePLZ;HalleName;GastVereinName;GastMannschaft;BegegnungNr;Altersklasse\nnot-a-date;3. KK West;VR;VfL Hamburg;;;;SC Lübeck;;2;Herren`;
        const parser = new ClickTtCsvFileAppointmentParserServiceImpl(new TestFileStorageService(csvMalformed), new MockLogger(), new TestTeamLeadRepository(), "SC Kleckersdorf")
        parser.parseAppointments("abc.csv").then(actualAppointments => {
            expect(actualAppointments.size).toEqual(0);
        })
    });

    it('should_handle_missing_columns_gracefully', () => {
        const csvMissingCols = `Termin;Staffel;Runde;HeimMannschaft\n10.10.2022 11:45;3. KK West;VR;VfL Hamburg`;
        const parser = new ClickTtCsvFileAppointmentParserServiceImpl(new TestFileStorageService(csvMissingCols), new MockLogger(), new TestTeamLeadRepository(), "SC Kleckersdorf")
        parser.parseAppointments("abc.csv").then(actualAppointments => {
            expect(actualAppointments.size).toEqual(0);
        })
    });

    it('should_trim_leading_spaces_from_location_fields', () => {
        const csvWithLeadingSpaces = `Termin;Staffel;Runde;HeimMannschaft;HalleStrasse;HalleOrt;HallePLZ;HalleName;GastVereinName;GastMannschaft;BegegnungNr;Altersklasse\n10.10.2022 11:45;3. KK West;VR;VfL Hamburg; Lübecker Straße 4; Lübeck; 23456; Holstenhalle;SC Lübeck;SC Lübeck III;2;Herren`;
        const parser = new ClickTtCsvFileAppointmentParserServiceImpl(new TestFileStorageService(csvWithLeadingSpaces), new MockLogger(), new TestTeamLeadRepository(), "SC Kleckersdorf")
        return parser.parseAppointments("abc.csv").then(actualAppointments => {
            const actualAppointment = actualAppointments.values().next().value
            expect(actualAppointment.location).toEqual("Holstenhalle, Lübecker Straße 4, 23456 Lübeck");
        })
    });
})
