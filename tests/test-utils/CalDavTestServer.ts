import {GenericContainer, StartedTestContainer, Wait} from "testcontainers";
import { DAVClient } from "tsdav";
import { LocalDateTime, DateTimeFormatter } from "@js-joda/core";

// Import ical.js module for parsing iCalendar data
import ICAL from 'ical.js';
import {randomUUID} from "node:crypto";

/**
 * Interface for appointment creation parameters
 */
export interface AppointmentParams {
    title: string;
    startDateTime: LocalDateTime;
    location: string;
    categories: string[];
    id: string;
    teamLeadName: string;
    organizerName: string;
    description: string;
    calendarUuid?: string;
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

            // Initialize the calendar
            await this.initializeCalendar();

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
        } catch (error) {
            if (this.containerRuntime) {
                try {
                    await this.containerRuntime.stop();
                } catch (stopError) {
                    // Container stop failed
                }
            }
            throw new Error("Could not start CalDAV server. Make sure Docker is installed and running.");
        }
    }

    /**
     * Stop the Radicale CalDAV server container and clean up
     */
    async stop(): Promise<void> {
        try {
            // Tear down the calendar (remove all test data)
            await this.teardown();
        } catch (teardownError) {
            console.error("Failed to tear down calendar:", teardownError);
        }

        // Stop the container
        try {
            if (this.containerRuntime) {
                await this.containerRuntime.stop();
            }
        } catch (error) {
            console.error("Failed to stop CalDAV server container:", error);
        }
    }

    /**
     * Initialize the calendar on Radicale
     * Creates a calendar collection for testing
     */
    private async initializeCalendar(): Promise<void> {
        try {
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

            // 201 = Created, 403/405 = Already exists or method not allowed (which is ok)
            if (!response.ok && response.status !== 403 && response.status !== 405) {
                // MKCALENDAR returned unexpected status
            }

            // Give the server a moment
            await this.sleep(500);
        } catch (error) {
            // Failed to initialize calendar, will be created on first write
            console.error("Failed to initialize calendar, it may be created on first write:", error);
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
            // Use the global DAV client
            if (!this.davClient) {
                return;
            }

            // Fetch all calendars
            const calendars = await this.davClient.fetchCalendars();

            // For each calendar, fetch and delete all objects
            for (const calendar of calendars) {
                try {
                    // Fetch all calendar objects (events)
                    const calendarObjects = await this.davClient.fetchCalendarObjects({
                        calendar: calendar
                    });

                    // Delete each calendar object
                    for (const obj of calendarObjects) {
                        try {
                            await this.davClient.deleteCalendarObject({
                                calendarObject: obj
                            });
                        } catch (deleteError) {
                            console.error(`Failed to delete calendar object ${obj.url}:`, deleteError);
                        }
                    }
                } catch (calendarError) {
                    console.error(`Failed to clean calendar ${calendar.url}:`, calendarError);
                }
            }
        } catch (error) {
            console.error("Failed to tear down calendar:", error);
        }
    }

    /**
     * Create an appointment in the calendar
     * @param params The appointment parameters
     */
    async createAppointment(params: AppointmentParams): Promise<AppointmentParams> {
        if (!this.davClient) {
            throw new Error("DAV client not available - call start() first");
        }

        // Build categories string with comma-separated values
        const categoriesStr = `CATEGORIES:${params.categories.join(',')}`;

        // Format datetime for iCalendar
        const dateTimeStr = params.startDateTime.format(
            DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss")
        );

        // Calculate end time: 150 minutes (2.5 hours) later
        const endDateTime = params.startDateTime.plusMinutes(150);
        const endDateTimeStr = endDateTime.format(
            DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss")
        );

        // Escape special characters in description for iCalendar format
        // According to RFC 5545, DESCRIPTION values need to escape: \, ;, , (comma), and newlines
        const escapedDescription = params.description
            .replace(/\\/g, '\\\\')  // Escape backslash first
            .replace(/\n/g, '\\n')   // Escape newlines
            .replace(/;/g, '\\;')    // Escape semicolons
            .replace(/,/g, '\\,');   // Escape commas

        // Create iCalendar event
        const internalId = randomUUID();
        const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test Appointment//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:${internalId}@test
DTSTART:${dateTimeStr}
DTEND:${endDateTimeStr}
SUMMARY:${params.title}
LOCATION:${params.location}
DESCRIPTION:${escapedDescription}
${categoriesStr}
STATUS:CONFIRMED
ORGANIZER;CN=${params.organizerName}:mailto:${params.organizerName.replace(/\s+/g, '.').toLowerCase()}@localhost.local
END:VEVENT
END:VCALENDAR`;

        const eventUrl = `${this.calendarUrl}${internalId}.ics`;

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

        return {
            ...params,
            calendarUuid: internalId
        };
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
    }): Promise<Array<AppointmentParams>> {
        if (!this.davClient) {
            throw new Error("DAV client not available - call start() first");
        }

        // Fetch calendars
        const calendars = await this.davClient.fetchCalendars();
        if (calendars.length === 0) {
            return [];
        }

        const calendar = calendars[0];
        const calendarObjects = await this.davClient.fetchCalendarObjects({
            calendar: calendar
        });

        const appointments: Array<AppointmentParams> = [];

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

                // Unescape special characters that were escaped in iCalendar format
                // According to RFC 5545, we need to unescape: \, ;, , (comma), and newlines
                const unescapedDescription = description
                    .replace('\\n', '\n')    // Unescape newlines
                    .replace(/\\;/g, ';')     // Unescape semicolons
                    .replace(/\\,/g, ',')     // Unescape commas
                    .replace(/\\\\/g, '\\');  // Unescape backslash last

                // Extract ID from description (if present), starting with "ID: "
                const idMatch = new RegExp(/ID:\s*(.+?)(?:\n|$)/).exec(unescapedDescription);
                const idFromDescription = idMatch ? idMatch[1].trim() : '';

                // Parse datetime
                const dtstart = vevent.getFirstPropertyValue('dtstart');
                let startDateTime: LocalDateTime = LocalDateTime.now();

                if (dtstart) {
                    if (typeof dtstart === 'string') {
                        // Parse ISO string format
                        const match = new RegExp(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/).exec(dtstart);
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
                    // Try to get all values from the property, not just the first one
                    try {
                        // ical.js may have multiple values as an array-like structure
                        const allValues = catProp.getValues && catProp.getValues();
                        if (Array.isArray(allValues) && allValues.length > 0) {
                            // If getValues() returns an array, use it
                            categories.push(...allValues.map(v => String(v).trim()).filter(v => v.length > 0));
                        } else {
                            // Fall back to getFirstValue() and split by comma
                            const catValue = catProp.getFirstValue();
                            if (typeof catValue === 'string') {
                                // Split by comma and add each category
                                const catArray = catValue.split(',').map(c => c.trim()).filter(c => c.length > 0);
                                categories.push(...catArray);
                            }
                        }
                    } catch (e) {
                        // If parsing fails, try the simple approach
                        const catValue = catProp.getFirstValue();
                        if (typeof catValue === 'string') {
                            const catArray = catValue.split(',').map(c => c.trim()).filter(c => c.length > 0);
                            categories.push(...catArray);
                        }
                    }
                }

                // Extract team lead name from description
                let teamLeadName = '';
                const teamLeadMatch = unescapedDescription.match(/Mannschaftsführer:\s*(.+?)(?:\n|$)/);
                if (teamLeadMatch) {
                    teamLeadName = teamLeadMatch[1].trim();
                }

                let organizerName = '';
                const organizerProp = vevent.getFirstProperty('organizer');
                if (organizerProp) {
                    const cnParam = organizerProp.getParameter('cn');
                    if (cnParam) {
                        organizerName = cnParam as string;
                    }
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
                    title,
                    startDateTime,
                    location,
                    categories,
                    id: idFromDescription,
                    teamLeadName,
                    organizerName,
                    description: unescapedDescription,
                    calendarUuid: obj.url.split('/').pop()?.replace('.ics', '') || ''
                });
            } catch (parseError) {
                console.error("Failed to parse calendar object:", parseError);
            }
        }

        return appointments;
    }
}
