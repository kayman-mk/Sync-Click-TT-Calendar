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
            // given - create a valid appointment with all details
            const teamLead = new TeamLead("John Doe", "Team A", "Herren", "VR", "john@example.com");
            const expectedTitle = "Test Match";
            const expectedLocation = "Test Hall";
            const expectedStartDateTime = LocalDateTime.of(2026, 3, 15, 19, 0);
            const expectedCategories = ["Click-TT", "Pokal"];
            const expectedId = "TestID-001";
            const expectedIsCup = false;
            const expectedAgeClass = "Herren";
            const expectedSubLeague = "SubLeague-1";
            const expectedMatchNumber = 10;
            const expectedRound = "VR";

            const appointment = new Appointment(
                expectedTitle,
                expectedStartDateTime,
                expectedLocation,
                expectedIsCup,
                expectedAgeClass,
                expectedCategories,
                expectedSubLeague,
                expectedMatchNumber,
                expectedRound,
                expectedId,
                teamLead
            );

            // when
            await service.createAppointment(appointment);

            // then - retrieve and verify ALL properties
            const retrievedAppointments = await caldavServer.getAppointments({
                titleFilter: expectedTitle
            });

            expect(retrievedAppointments.length).toBe(1);
            const retrievedAppointment = retrievedAppointments[0];

            // Validate title
            expect(retrievedAppointment.title).toBe(expectedTitle);

            // Validate location
            expect(retrievedAppointment.location).toBe(expectedLocation);

            // Validate start date and time - year
            expect(retrievedAppointment.startDateTime.year()).toBe(expectedStartDateTime.year());

            // Validate start date and time - month
            expect(retrievedAppointment.startDateTime.monthValue()).toBe(expectedStartDateTime.monthValue());

            // Validate start date and time - day
            expect(retrievedAppointment.startDateTime.dayOfMonth()).toBe(expectedStartDateTime.dayOfMonth());

            // Validate start date and time - hour
            expect(retrievedAppointment.startDateTime.hour()).toBe(expectedStartDateTime.hour());

            // Validate start date and time - minute
            expect(retrievedAppointment.startDateTime.minute()).toBe(expectedStartDateTime.minute());

            // Validate at least primary category is preserved
            expect(retrievedAppointment.categories.length).toBe(2);
            expect(retrievedAppointment.categories).toContain("Click-TT");
            expect(retrievedAppointment.categories).toContain("Pokal");

            // Validate ID is preserved
            expect(retrievedAppointment.id).toBe(expectedId);

            // Validate organizer information (team lead)
            expect(retrievedAppointment.organizerName).toBe(teamLead.fullName);

            // Validate description contains team lead name
            expect(retrievedAppointment.description).toEqual("Mannschaftsführer: John Doe\n\nKategorien: Click-TT, Pokal\n\nID: TestID-001");
        });
    });

    describe('downloadAppointments', () => {
        it('should_download_all_appointments_within_date_range', async () => {
            // given
            // when
            // then
        });

        it('should_return_empty_set_when_no_appointments_exist_in_date_range', async () => {
            // given
            // when
            // then
        });

        it('should_exclude_appointments_before_minimum_date_time', async () => {
            // given
            // when
            // then
        });

        it('should_exclude_appointments_after_maximum_date_time', async () => {
            // given
            // when
            // then
        });

        it('should_download_appointments_with_correct_properties', async () => {
            // given
            // when
            // then
        });

        it('should_download_appointments_and_associate_with_team_leads', async () => {
            // given
            // when
            // then
        });

        it('should_handle_appointments_with_missing_team_lead_gracefully', async () => {
            // given
            // when
            // then
        });

        it('should_parse_categories_from_downloaded_appointments', async () => {
            // given
            // when
            // then
        });

        it('should_extract_click_tt_id_from_appointment_description', async () => {
            // given
            // when
            // then
        });

        it('should_skip_appointments_without_click_tt_category', async () => {
            // given
            // when
            // then
        });

        it('should_handle_appointments_with_multiple_categories', async () => {
            // given
            // when
            // then
        });

        it('should_filter_appointments_by_exact_date_range', async () => {
            // given
            // when
            // then
        });

        it('should_convert_appointment_date_time_to_local_berlin_timezone', async () => {
            // given
            // when
            // then
        });

        it('should_handle_parsing_errors_in_vevent_components', async () => {
            // given
            // when
            // then
        });

        it('should_log_warning_when_appointment_lacks_click_tt_id', async () => {
            // given
            // when
            // then
        });

        it('should_handle_empty_calendar_gracefully', async () => {
            // given
            // when
            // then
        });

        it('should_return_set_of_appointments_not_list', async () => {
            // given
            // when
            // then
        });

        it('should_retrieve_organizer_information_from_appointments', async () => {
            // given
            // when
            // then
        });
    });
});
