import { Appointment, AppointmentInterface } from "../model/appointment/Appointment";

export interface AppointmentParserService {
    parseAppointments(filename: string): Promise<Set<AppointmentInterface>>;
}