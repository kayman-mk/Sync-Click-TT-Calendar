import winston from 'winston'
import { LoggerImpl } from "../../../src/adapter/LoggerImpl"
import { SyncCalendarApplicationService } from "../../../src/application/SyncCalendarApplicationService"
import { AppointmentParserService } from "../../../src/domain/service/AppointmentParserService"
import { CalendarService } from "../../../src/domain/service/CalendarService"
import { FileStorageService } from "../../../src/domain/service/FileStorageService"
import { AppointmentInterface } from "../../../src/domain/model/Appointment"
import { ZonedDateTime } from "@js-joda/core"
import { TestSportsHallRepository } from './TestSportsHallRepository';

class TestFileStorageService implements FileStorageService {
    constructor(private content: string = "") { }

    readFile(filename: string): Buffer {
        return Buffer.from(this.content);
    }

    writeFile(filename: string, content: string): void {
        this.content = content;
    }

    deleteFile(filename: string): void {
        // No-op for tests
    }

    getWrittenContent(): string {
        return this.content;
    }
}

class TestLogger extends LoggerImpl {
    constructor() {
        super(new winston.transports.Console({ silent: true }))
    }
}

class TestAppointmentParserService implements AppointmentParserService {
    async parseAppointments(filename: string): Promise<Set<AppointmentInterface>> {
        return new Set();
    }
}

class TestCalendarService implements CalendarService {
    async downloadAppointments(from: ZonedDateTime, to: ZonedDateTime): Promise<Set<AppointmentInterface>> {
        return new Set();
    }

    deleteAppointment(appointment: AppointmentInterface): void {
    }

    async createAppointment(appointment: AppointmentInterface): Promise<void> {
    }

    async updateAppointment(oldAppointment: AppointmentInterface, newAppointment: AppointmentInterface): Promise<void> {
    }
}

describe('Parse myTischtennis.de table structure', () => {
    it('should_parse_date_with_day_of_week_prefix_when_processing_german_date_format', () => {
        // given: a date with day of week prefix like "Mo., 25.08.2025"
        const testFileStorage = new TestFileStorageService();
        const syncService = new SyncCalendarApplicationService(
            new TestAppointmentParserService(),
            new TestCalendarService(),
            testFileStorage,
            new TestLogger(),
            new TestSportsHallRepository()
        );

        // Mock the HTML with a simple table structure
        const mockHtml = `
            <table class="w-full caption-bottom">
                <tbody>
                    <tr>
                        <td>Mo., 25.08.2025</td>
                        <td>20:15</td>
                        <td>1</td>
                        <td>KP EB</td>
                        <td>SC Klecken</td>
                        <td>MTV Lauenbrück</td>
                        <td>2:6</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
        `;

        // Mock axios to return our test HTML
        const axios = require('axios');
        jest.spyOn(axios, 'get').mockResolvedValue({ data: mockHtml });

        // when
        return syncService.syncCalendarFromMyTischtennisWebpage('http://test.com').catch(() => {
            // then: check the CSV content that was written
            const csvContent = testFileStorage.getWrittenContent();
            const lines = csvContent.split('\n');

            // Skip header line and check first data row
            expect(lines.length).toBeGreaterThan(1);
            const firstDataRow = lines[1];

            // The date should be cleaned to "25.08.2025 20:15" format
            expect(firstDataRow).toMatch(/^25\.08\.2025 20:15;/);
            expect(firstDataRow).not.toMatch(/^Mo\., /); // Should not start with day of week
        });
    });

    it('should_strip_trailing_v_character_when_appointment_was_moved', () => {
        // given: a time with trailing "v" indicating the appointment was moved (verlegt)
        const testFileStorage = new TestFileStorageService();
        const syncService = new SyncCalendarApplicationService(
            new TestAppointmentParserService(),
            new TestCalendarService(),
            testFileStorage,
            new TestLogger(),
            new TestSportsHallRepository()
        );

        // Mock the HTML with a table containing a moved appointment (marked with "v")
        const mockHtml = `
            <table class="w-full caption-bottom">
                <tbody>
                    <tr>
                        <td>Di., 16.09.2025</td>
                        <td>20:30v</td>
                        <td>1</td>
                        <td>Bezirksklasse A</td>
                        <td>SC Klecken</td>
                        <td>TuS Jork</td>
                        <td>TBD</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
        `;

        // Mock axios to return our test HTML
        const axios = require('axios');
        jest.spyOn(axios, 'get').mockResolvedValue({ data: mockHtml });

        // when
        return syncService.syncCalendarFromMyTischtennisWebpage('http://test.com').catch(() => {
            // then: check the CSV content that was written
            const csvContent = testFileStorage.getWrittenContent();
            const lines = csvContent.split('\n');

            // Skip header line and check first data row
            expect(lines.length).toBeGreaterThan(1);
            const firstDataRow = lines[1];

            // The date should be cleaned to "16.09.2025 20:30" format without the "v"
            expect(firstDataRow).toMatch(/^16\.09\.2025 20:30;/);
            expect(firstDataRow).not.toMatch(/v/); // Should not contain "v" character
        });
    });
});
