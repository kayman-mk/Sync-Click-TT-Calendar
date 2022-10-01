import {DateTimeFormatter, LocalDateTime} from '@js-joda/core';

export class Appointment {
    constructor(readonly title: string, readonly startDateTime: LocalDateTime, readonly id: string | undefined) {}
}

export class AppointmentFactory {
    static create(localTeam: string, foreignTeam: string, startDateTime: string, subLeague: string, matchNumber: number): Appointment {
        const formatter = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

        return new Appointment(localTeam + " - " + foreignTeam, LocalDateTime.parse(startDateTime, formatter), "build the id");
    }

    static createFromRaw(title: string, startDateTime: LocalDateTime, id?: string): Appointment {
        return new Appointment(title, startDateTime, id);
    }
}