import {LocalDateTime} from '@js-joda/core';

export class Appointment {
    constructor(readonly title: String, readonly description: String, readonly gameCount: Number, readonly localTeamName: String, readonly foreignTeamName: String, readonly startDateTime: LocalDateTime) {}
}