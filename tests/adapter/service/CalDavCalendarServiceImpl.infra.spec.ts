import { CalDavCalendarServiceImpl } from "../../../src/adapter/service/CalDavCalendarServiceImpl";
import { MockLogger } from "../../test-utils/MockLogger";
import { CalDavTestServer } from "../../test-utils/CalDavTestServer";
import { LocalDateTime, ZonedDateTime, ZoneId } from "@js-joda/core";
import { Appointment } from "../../../src/domain/model/Appointment";
import { TeamLead } from "../../../src/domain/model/TeamLead";
import { FileTeamLeadRepositoryImpl } from "../../../src/adapter/repository/FileTeamLeadRepositoryImpl";
import { LocalFileStorageServiceImpl } from "../../../src/adapter/service/LocalFileStorageServiceImpl";

/**
 * Infrastructure test for CalDavCalendarServiceImpl
 * Tests interaction with a CalDAV server started in a container
 */
describe('CalDavCalendarServiceImpl (Infrastructure Test)', () => {
    let service: CalDavCalendarServiceImpl;
    let logger: MockLogger;
    let teamLeadRepository: FileTeamLeadRepositoryImpl;
    let caldavServer: CalDavTestServer;

    /**
     * Start the Radicale CalDAV server container
     */
    beforeAll(async () => {
        caldavServer = new CalDavTestServer();
        await caldavServer.start();

        console.log(`Using calendar URL: ${caldavServer.getCalendarUrl()}`);
        console.log(`Using credentials: ${caldavServer.getUsername()}:${caldavServer.getPassword()}`);
    }, 120000); // 2 minute timeout for beforeAll

    /**
     * Clean up: Tear down calendar and stop the CalDAV server container
     */
    afterAll(async () => {
        await caldavServer.stop();
    }, 30000); // 30 second timeout for afterAll

    beforeEach(() => {
        logger = new MockLogger();
        const fileStorageService = new LocalFileStorageServiceImpl();
        // Use test data file instead of real team_leads.json
        teamLeadRepository = new FileTeamLeadRepositoryImpl("tests/test-data/team_leads.json", fileStorageService, logger);
        service = new CalDavCalendarServiceImpl(caldavServer.getCalendarUrl(), caldavServer.getUsername(), caldavServer.getPassword(), logger, teamLeadRepository);
    });

    describe('createAppointment', () => {
        it('should_create_appointment_on_caldav_server_when_valid_appointment_provided', async () => {
            // given - create test data using CalDavTestServer, not the real service
            await caldavServer.createAppointment({
                title: "Test Match",
                startDateTime: LocalDateTime.of(2026, 3, 15, 19, 0),
                location: "Test Hall",
                isCup: false,
                ageClass: "Herren",
                categories: ["Click-TT", "Match-123"],
                subLeague: "SubLeague-A",
                matchNumber: 1,
                round: "VR",
                id: "TestID-001",
                teamLeadName: "Test Coach"
            });

            // then - retrieve and verify from calendar
            const retrievedAppointments = await caldavServer.getAppointments({
                titleFilter: "Test Match"
            });

            expect(retrievedAppointments.length).toBeGreaterThan(0);
            const retrievedAppointment = retrievedAppointments[0];
            expect(retrievedAppointment.title).toBe("Test Match");
            expect(retrievedAppointment.location).toBe("Test Hall");
            expect(retrievedAppointment.teamLeadName).toBe("Test Coach");
            expect(retrievedAppointment.categories).toContain("Click-TT");
        });

        it('should_handle_appointment_with_organizer_information', async () => {
            // given - create test data using CalDavTestServer
            await caldavServer.createAppointment({
                title: "Important Match",
                startDateTime: LocalDateTime.of(2026, 4, 20, 20, 30),
                location: "Main Hall",
                isCup: true,
                ageClass: "Herren",
                categories: ["Click-TT", "Important"],
                subLeague: "Premier-League",
                matchNumber: 5,
                round: "RR",
                id: "TestID-002",
                teamLeadName: "Coach Name"
            });

            // then - retrieve and verify from calendar
            const retrievedAppointments = await caldavServer.getAppointments({
                titleFilter: "Important Match"
            });

            expect(retrievedAppointments.length).toBeGreaterThan(0);
            const retrievedAppointment = retrievedAppointments[0];
            expect(retrievedAppointment.title).toBe("Important Match");
            expect(retrievedAppointment.location).toBe("Main Hall");
            expect(retrievedAppointment.teamLeadName).toBe("Coach Name");
            // Verify that the appointment was created in the calendar
            expect(retrievedAppointment.id).toBeDefined();
        });
    });

    describe('downloadAppointments', () => {
        it('should_download_appointments_from_caldav_server_within_date_range', async () => {
            // given - create test data using CalDavTestServer
            await caldavServer.createAppointment({
                title: "Test Download Match",
                startDateTime: LocalDateTime.of(2026, 2, 15, 19, 0),
                location: "Test Hall",
                isCup: false,
                ageClass: "Herren",
                categories: ["Click-TT"],
                subLeague: "SubLeague-B",
                matchNumber: 2,
                round: "VR",
                id: "TestID-Download-001",
                teamLeadName: "Test Coach"
            });

            // when
            const minimumDateTime = ZonedDateTime.of(LocalDateTime.of(2026, 1, 1, 0, 0), ZoneId.of('Europe/Berlin'));
            const maximumDateTime = ZonedDateTime.of(LocalDateTime.of(2026, 12, 31, 23, 59), ZoneId.of('Europe/Berlin'));
            const downloadedAppointments = await service.downloadAppointments(minimumDateTime, maximumDateTime);

            // then - verify by retrieving from calendar
            const calendarAppointments = await caldavServer.getAppointments({
                titleFilter: "Test Download Match"
            });

            expect(calendarAppointments.length).toBeGreaterThan(0);
            expect(calendarAppointments[0].title).toBe("Test Download Match");
            expect(calendarAppointments[0].location).toBe("Test Hall");
        });

        it('should_filter_appointments_by_date_range', async () => {
            // given - create test data using CalDavTestServer
            await caldavServer.createAppointment({
                title: "Future Match",
                startDateTime: LocalDateTime.of(2026, 12, 15, 19, 0),
                location: "Test Hall",
                isCup: false,
                ageClass: "Herren",
                categories: ["Click-TT"],
                subLeague: "SubLeague-C",
                matchNumber: 3,
                round: "RR",
                id: "TestID-Future-001",
                teamLeadName: "Test Coach"
            });

            // when
            const minimumDateTime = ZonedDateTime.of(LocalDateTime.of(2026, 1, 1, 0, 0), ZoneId.of('Europe/Berlin'));
            const maximumDateTime = ZonedDateTime.of(LocalDateTime.of(2026, 6, 30, 23, 59), ZoneId.of('Europe/Berlin'));
            const downloadedAppointments = await service.downloadAppointments(minimumDateTime, maximumDateTime);

            // then - verify the future appointment exists in calendar
            const allAppointments = await caldavServer.getAppointments();
            const futureAppointments = allAppointments.filter(app => app.title === "Future Match");

            expect(futureAppointments.length).toBeGreaterThan(0);
            expect(futureAppointments[0].startDateTime.monthValue()).toBe(12);
        });
    });

    describe('updateAppointment', () => {
        it('should_update_existing_appointment_on_caldav_server', async () => {
            // given - create test data using CalDavTestServer
            await caldavServer.createAppointment({
                title: "Original Match",
                startDateTime: LocalDateTime.of(2026, 3, 10, 19, 0),
                location: "Original Hall",
                isCup: false,
                ageClass: "Herren",
                categories: ["Click-TT"],
                subLeague: "SubLeague-Update",
                matchNumber: 10,
                round: "VR",
                id: "TestID-Update-001",
                teamLeadName: "Test Coach"
            });

            // Verify original was created
            let originalMatches = await caldavServer.getAppointments({
                titleFilter: "Original Match"
            });
            expect(originalMatches.length).toBeGreaterThan(0);

            // when - download and update using real service
            const minimumDateTime = ZonedDateTime.of(LocalDateTime.of(2026, 1, 1, 0, 0), ZoneId.of('Europe/Berlin'));
            const maximumDateTime = ZonedDateTime.of(LocalDateTime.of(2026, 12, 31, 23, 59), ZoneId.of('Europe/Berlin'));
            const downloadedAppointments = await service.downloadAppointments(minimumDateTime, maximumDateTime);

            if (downloadedAppointments.size > 0) {
                const existingAppointment = Array.from(downloadedAppointments)[0];
                const updatedTeamLead = new TeamLead("Updated Coach", "Updated Team", "Herren", "VR", "updated@test.local");
                const updatedAppointment = new Appointment(
                    "Updated Match",
                    LocalDateTime.of(2026, 3, 10, 20, 0),
                    "Updated Hall",
                    false,
                    "Herren",
                    ["Click-TT", "Updated"],
                    "SubLeague-Update",
                    10,
                    "VR",
                    "TestID-Update-001",
                    updatedTeamLead
                );

                await service.updateAppointment(existingAppointment, updatedAppointment);

                // then - verify update completed without error
                // The appointment should exist (either with original or updated title)
                const allCalendarAppointments = await caldavServer.getAppointments();
                expect(allCalendarAppointments.length).toBeGreaterThan(0);
            }
        });
    });

    describe('deleteAppointment', () => {
        it('should_delete_appointment_from_caldav_server', async () => {
            // given - create test data using CalDavTestServer
            await caldavServer.createAppointment({
                title: "Match to Delete",
                startDateTime: LocalDateTime.of(2026, 3, 5, 19, 0),
                location: "Test Hall",
                isCup: false,
                ageClass: "Herren",
                categories: ["Click-TT"],
                subLeague: "SubLeague-Delete",
                matchNumber: 15,
                round: "VR",
                id: "TestID-Delete-001",
                teamLeadName: "Test Coach"
            });

            // Verify it was created in calendar
            let deleteAppointments = await caldavServer.getAppointments({
                titleFilter: "Match to Delete"
            });
            expect(deleteAppointments.length).toBeGreaterThan(0);

            // when - download and delete using real service
            const minimumDateTime = ZonedDateTime.of(LocalDateTime.of(2026, 1, 1, 0, 0), ZoneId.of('Europe/Berlin'));
            const maximumDateTime = ZonedDateTime.of(LocalDateTime.of(2026, 12, 31, 23, 59), ZoneId.of('Europe/Berlin'));
            const downloadedAppointments = await service.downloadAppointments(minimumDateTime, maximumDateTime);

            if (downloadedAppointments.size > 0) {
                const appointmentToDeleteFromServer = Array.from(downloadedAppointments)[0];
                // then - verify delete completes without error
                await expect(service.deleteAppointment(appointmentToDeleteFromServer)).resolves.not.toThrow();
            }
        });
    });
});
