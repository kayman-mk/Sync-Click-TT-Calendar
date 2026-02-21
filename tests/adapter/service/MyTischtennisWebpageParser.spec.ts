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

