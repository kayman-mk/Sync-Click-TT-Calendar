import { Appointment } from "../../domain/model/appointment/Appointment";
import { CalendarService } from "../../domain/service/CalendarService";

export class WebCalCalendarServiceImpl implements CalendarService {
    constructor() {}
    
    downloadAppointments(): Set<Appointment> {
        throw new Error("Method not implemented.");
    }

}