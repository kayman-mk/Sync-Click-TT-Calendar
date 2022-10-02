import {DateTimeFormatter, LocalDateTime} from '@js-joda/core';

export class Appointment {
    constructor(readonly title: string, readonly startDateTime: LocalDateTime, readonly id: string, readonly location: string) {}
}

export class AppointmentFactory {
    static create(localTeam: string, foreignTeam: string, startDateTime: string, subLeague: string, matchNumber: number, location: string): Appointment {
        const formatter = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

        return new Appointment(localTeam + " - " + foreignTeam, LocalDateTime.parse(startDateTime, formatter), "ID: " + subLeague + "-" + matchNumber, location);
    }

    static createFromRaw(title: string, startDateTime: LocalDateTime, id: string, location: string): Appointment {
        return new Appointment(title, startDateTime, id, location);
    }
}