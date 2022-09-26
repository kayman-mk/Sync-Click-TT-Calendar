import { injectable } from "inversify";
import { Appointment } from "../model/appointment/Appointment";

export interface AppointmentParserService {
    parseAppointments(filename: string): Promise<Set<Appointment>>;
}