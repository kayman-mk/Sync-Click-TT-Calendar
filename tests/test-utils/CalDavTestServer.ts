import {GenericContainer, StartedTestContainer, Wait} from "testcontainers";
import { DAVClient } from "tsdav";
import { LocalDateTime, DateTimeFormatter } from "@js-joda/core";

// Import ical.js module for parsing iCalendar data
import ICAL from 'ical.js';

/**
 * Interface for appointment creation parameters
 */
export interface CreateAppointmentParams {
    title: string;
    startDateTime: LocalDateTime;
    location: string;
    isCup: boolean;
    ageClass: string;
    categories: string[];
    subLeague: string;
    matchNumber: number;
    round: string;
    id?: string;
    teamLeadName: string;
}

/**
 * Manages the lifecycle of a Radicale CalDAV test server using Testcontainers
 * Automatically handles container startup, health checks, initialization, and cleanup
 */
export class CalDavTestServer {
    private static readonly USERNAME = "admin";
    private static readonly PASSWORD = "";
    private static readonly RADICALE_PORT = 5232;

    private container: GenericContainer | undefined = undefined;
    private containerRuntime: StartedTestContainer | undefined = undefined;
    private calendarUrl: string = "";
    private davClient: DAVClient | undefined = undefined;

    /**
     * Get the calendar URL (available after start() is called)
     */
    getCalendarUrl(): string {
        if (!this.calendarUrl) {
            throw new Error("Calendar URL not available - call start() first");
        }
        return this.calendarUrl;
    }

    /**
     * Get the username for CalDAV authentication
     */
    getUsername(): string {
        return CalDavTestServer.USERNAME;
    }

    /**
     * Get the password for CalDAV authentication
     */
    getPassword(): string {
        return CalDavTestServer.PASSWORD;
    }

    /**
     * Start the Radicale CalDAV server container with automatic random port allocation
     */
    async start(): Promise<void> {
        console.log("Starting CalDAV server container with random port allocation...");

        try {
            // Create the container
            this.container = new GenericContainer("tomsquest/docker-radicale:latest")
                .withExposedPorts(CalDavTestServer.RADICALE_PORT)
                .withEnvironment({
                    RADICALE_AUTH_TYPE: "none",
                    RADICALE_RIGHTS_TYPE: "owner_only"
                })
                .withWaitStrategy(
                    Wait.forHttp("/", CalDavTestServer.RADICALE_PORT)
                        .withStartupTimeout(60000)
                );

            // Start the container - testcontainers automatically assigns a random host port
            this.containerRuntime = await this.container.start();
            const mappedPort = this.containerRuntime.getMappedPort(CalDavTestServer.RADICALE_PORT);
            const host = this.containerRuntime.getHost();

            // Construct the calendar URL with the dynamically assigned port
            this.calendarUrl = `http://${host}:${mappedPort}/admin/calendar.ics/`;
            console.log(`CalDAV server started at ${this.calendarUrl}`);

            // Initialize the calendar
            console.log("Initializing calendar...");
            await this.initializeCalendar();
            console.log("Calendar initialized!");

            // Create and login the global DAV client
            this.davClient = new DAVClient({
                serverUrl: this.calendarUrl,
                credentials: {
                    username: CalDavTestServer.USERNAME,
                    password: CalDavTestServer.PASSWORD,
                },
                authMethod: 'Basic',
                defaultAccountType: 'caldav'
            });
            await this.davClient.login();
            console.log("DAV client initialized and logged in");
        } catch (error) {
            console.error("Failed to start CalDAV server:", error);
            if (this.containerRuntime) {
                try {
                    await this.containerRuntime.stop();
                } catch (stopError) {
                    console.error("Failed to stop container:", stopError);
                }
            }
            throw new Error("Could not start CalDAV server. Make sure Docker is installed and running.");
        }
    }

    /**
     * Stop the Radicale CalDAV server container and clean up
     */
    async stop(): Promise<void> {
        console.log("Starting test cleanup...");

        try {
            // Tear down the calendar (remove all test data)
            console.log("Tearing down test calendar data...");
            await this.teardown();
        } catch (teardownError) {
            console.warn("Calendar teardown encountered issues:", teardownError);
        }

        // Stop the container
        console.log("Stopping CalDAV server container...");
        try {
            if (this.containerRuntime) {
                await this.containerRuntime.stop();
                console.log("CalDAV server stopped and cleaned up.");
            }
        } catch (error) {
            console.error("Failed to stop CalDAV server:", error);
        }
    }

    /**
     * Initialize the calendar on Radicale
     * Creates a calendar collection for testing
     */
    private async initializeCalendar(): Promise<void> {
        try {
            console.log("Creating calendar collection...");

            // Create an HTTP request to MKCALENDAR
            const authHeader = this.buildAuthHeader();

            const xmlBody = `<?xml version="1.0" encoding="utf-8" ?>
<C:mkcalendar xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:set>
    <D:prop>
      <D:displayname>Test Calendar</D:displayname>
      <C:supported-calendar-component-set>
        <C:comp name="VEVENT"/>
      </C:supported-calendar-component-set>
    </D:prop>
  </D:set>
</C:mkcalendar>`;

            const contentLength = Buffer.byteLength(xmlBody).toString();

            const response = await fetch(this.calendarUrl, {
                method: 'MKCALENDAR',
                headers: {
                    'Content-Type': 'application/xml',
                    'Authorization': authHeader,
                    'Content-Length': contentLength
                },
                body: xmlBody
            });

            console.log(`MKCALENDAR response: ${response.status} ${response.statusText}`);

            // 201 = Created, 403/405 = Already exists or method not allowed (which is ok)
            if (!response.ok && response.status !== 403 && response.status !== 405) {
                console.warn(`MKCALENDAR returned ${response.status}`);
            }

            // Give the server a moment
            await this.sleep(500);
            console.log("Calendar creation attempt completed");
        } catch (error) {
            console.warn("Failed to initialize calendar:", error);
            // Don't fail - calendar will be created on first write
        }
    }

    /**
     * Sleep for a given duration
     */
    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Build the Basic Authentication header using CalDAV test server credentials
     * @returns The Basic Authentication header value
     */
    private buildAuthHeader(): string {
        const credentials = `${CalDavTestServer.USERNAME}:${CalDavTestServer.PASSWORD}`;
        const encodedCredentials = Buffer.from(credentials).toString('base64');
        return `Basic ${encodedCredentials}`;
    }

    /**
     * Tear down/clean up the calendar after tests
     * Removes all test events from the server
     */
    private async teardown(): Promise<void> {
        try {
            console.log("Tearing down test calendar...");

            // Use the global DAV client
            if (!this.davClient) {
                console.warn("DAV client not available");
                return;
            }

            // Fetch all calendars
            const calendars = await this.davClient.fetchCalendars();
            console.log(`Found ${calendars.length} calendar(s) for cleanup`);

            // For each calendar, fetch and delete all objects
            for (const calendar of calendars) {
                try {
                    console.log(`Cleaning calendar: ${calendar.displayName} (${calendar.url})`);

                    // Fetch all calendar objects (events)
                    const calendarObjects = await this.davClient.fetchCalendarObjects({
                        calendar: calendar
                    });

                    console.log(`Found ${calendarObjects.length} event(s) to delete`);

                    // Delete each calendar object
                    for (const obj of calendarObjects) {
                        try {
                            await this.davClient.deleteCalendarObject({
                                calendarObject: obj
                            });
                            console.log(`Deleted event: ${obj.url}`);
                        } catch (deleteError) {
                            console.warn(`Failed to delete calendar object ${obj.url}:`, deleteError);
                        }
                    }
                } catch (calendarError) {
                    console.warn(`Failed to clean calendar ${calendar.displayName}:`, calendarError);
                }
            }

            console.log("Calendar teardown completed");
        } catch (error) {
            console.warn("Failed to tear down calendar:", error);
            // Don't fail - container will be stopped anyway
        }
    }

    /**
     * Create an appointment in the calendar
     * @param params The appointment parameters
     */
    async createAppointment(params: CreateAppointmentParams): Promise<void> {
        if (!this.davClient) {
            throw new Error("DAV client not available - call start() first");
        }

        // Generate appointment ID: use provided ID if available, otherwise derive one
        // from sub-league, match number, round, and the year of the start date/time.
        const appointmentId = params.id || `${params.subLeague}-${params.matchNumber}-${params.round}-${params.startDateTime.year()}`;

        // Build categories string
        const categoriesStr = params.categories.map(cat => `CATEGORIES:${cat}`).join('\n');

        // Format datetime for iCalendar
        const dateTimeStr = params.startDateTime.format(
            DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss")
        );

        // Calculate end time: 150 minutes (2.5 hours) later
        const endDateTime = params.startDateTime.plusMinutes(150);
        const endDateTimeStr = endDateTime.format(
            DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss")
        );

        // Create iCalendar event
        const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test Appointment//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:${appointmentId}@test
DTSTART:${dateTimeStr}
DTEND:${endDateTimeStr}
SUMMARY:${params.title}
LOCATION:${params.location}
DESCRIPTION:Mannschaftsführer: ${params.teamLeadName}\n\nKategorien: ${params.categories.join(', ')}\n\nID: ${appointmentId}
${categoriesStr}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

        // Get the calendar to write to
        const calendars = await this.davClient.fetchCalendars();
        if (calendars.length === 0) {
            throw new Error("No calendar found for creating appointment");
        }

        const eventUrl = `${this.calendarUrl}${appointmentId}.ics`;

        // Build the Basic Authentication header using the CalDAV test server credentials.
        const authHeader = this.buildAuthHeader();

        const response = await fetch(eventUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'text/calendar',
                'Authorization': authHeader
            },
            body: icalContent
        });

        if (!response.ok) {
            throw new Error(`Failed to create appointment: ${response.status} ${response.statusText}`);
        }

        console.log(`Created appointment: ${params.title} (${appointmentId})`);
    }

    /**
     * Retrieve appointments from the calendar
     * @param filters Optional filters to narrow down results
     * @returns Array of retrieved appointments
     */
    async getAppointments(filters?: {
        categoryFilter?: string;
        titleFilter?: string;
        startDateTimeFrom?: LocalDateTime;
        startDateTimeTo?: LocalDateTime;
    }): Promise<Array<{
        id: string;
        title: string;
        startDateTime: LocalDateTime;
        location: string;
        categories: string[];
        description: string;
        teamLeadName: string;
    }>> {
        if (!this.davClient) {
            throw new Error("DAV client not available - call start() first");
        }

        // Fetch calendars
        const calendars = await this.davClient.fetchCalendars();
        if (calendars.length === 0) {
            console.log("No calendars found");
            return [];
        }

        const calendar = calendars[0];
        const calendarObjects = await this.davClient.fetchCalendarObjects({
            calendar: calendar
        });

        const appointments: Array<{
            id: string;
            title: string;
            startDateTime: LocalDateTime;
            location: string;
            categories: string[];
            description: string;
            teamLeadName: string;
        }> = [];

        // Parse iCalendar objects
        for (const obj of calendarObjects) {
            try {
                const jcalData = ICAL.parse(obj.data);
                const vcalendar = new ICAL.Component(jcalData);
                const vevent = vcalendar.getFirstSubcomponent('vevent');

                if (!vevent) continue;

                const title = String(vevent.getFirstPropertyValue('summary') || '');
                const location = String(vevent.getFirstPropertyValue('location') || '');
                const description = String(vevent.getFirstPropertyValue('description') || '');
                const uid = String(vevent.getFirstPropertyValue('uid') || '');

                // Extract ID from UID (remove @test suffix if present)
                const id = uid.replace('@test', '');

                // Parse datetime
                const dtstart = vevent.getFirstPropertyValue('dtstart');
                let startDateTime: LocalDateTime = LocalDateTime.now();

                if (dtstart) {
                    if (typeof dtstart === 'string') {
                        // Parse ISO string format
                        const match = dtstart.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
                        if (match) {
                            startDateTime = LocalDateTime.of(
                                Number.parseInt(match[1]),
                                Number.parseInt(match[2]),
                                Number.parseInt(match[3]),
                                Number.parseInt(match[4]),
                                Number.parseInt(match[5]),
                                Number.parseInt(match[6])
                            );
                        }
                    } else if (dtstart && typeof dtstart === 'object' && 'toJSDate' in dtstart) {
                        // JS-Joda date object
                        const date = (dtstart as any).toJSDate();
                        const year = date.getFullYear();
                        const month = date.getMonth() + 1;
                        const day = date.getDate();
                        const hour = date.getHours();
                        const minute = date.getMinutes();
                        const second = date.getSeconds();
                        startDateTime = LocalDateTime.of(year, month, day, hour, minute, second);
                    }
                }

                // Extract categories
                const categoriesProperty = vevent.getAllProperties('categories');
                const categories: string[] = [];
                for (const catProp of categoriesProperty) {
                    const catValue = catProp.getFirstValue();
                    if (typeof catValue === 'string') {
                        categories.push(catValue);
                    }
                }

                // Extract team lead name from description
                let teamLeadName = '';
                const teamLeadMatch = description.match(/Mannschaftsführer:\s*(.+?)(?:\n|$)/);
                if (teamLeadMatch) {
                    teamLeadName = teamLeadMatch[1].trim();
                }

                // Apply filters if provided
                if (filters) {
                    if (filters.categoryFilter && !categories.includes(filters.categoryFilter)) {
                        continue;
                    }
                    if (filters.titleFilter && !title.includes(filters.titleFilter)) {
                        continue;
                    }
                    if (filters.startDateTimeFrom && startDateTime.isBefore(filters.startDateTimeFrom)) {
                        continue;
                    }
                    if (filters.startDateTimeTo && startDateTime.isAfter(filters.startDateTimeTo)) {
                        continue;
                    }
                }

                appointments.push({
                    id,
                    title,
                    startDateTime,
                    location,
                    categories,
                    description,
                    teamLeadName
                });

            } catch (parseError) {
                console.warn(`Failed to parse calendar object ${obj.url}:`, parseError);
            }
        }

        console.log(`Retrieved ${appointments.length} appointment(s) from calendar`);
        return appointments;
    }
}
