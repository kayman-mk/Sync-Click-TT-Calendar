import { inject, injectable } from "inversify";
import { Logger } from "../adapter/Logger";
import SERVICE_IDENTIFIER from "../dependency_injection";
import { AppointmentParserService } from "../domain/service/AppointmentParserService";

@injectable()
export class SyncCalendarApplicationService {
    constructor(@inject(SERVICE_IDENTIFIER.AppointmentParserService) readonly appointmentParserService: AppointmentParserService) {}

    async syncCalendar() {
        // parsing ClickTT CSV file
       this.appointmentParserService.parseAppointments();
       
        // download Calendar Items

        // for each calendar item --> check against Click-TT appointment and do the action

        // for all unprocessed Click-TT items: create them (missing in calendar)
    }
}