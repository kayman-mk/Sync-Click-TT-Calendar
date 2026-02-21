import { Appointment, AppointmentInterface } from "../model/Appointment";

export interface AppointmentParserService {
    parseAppointments(filename: string): Promise<Set<AppointmentInterface>>;
}
