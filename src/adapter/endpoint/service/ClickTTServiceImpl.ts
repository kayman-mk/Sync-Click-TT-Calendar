import { Appointment } from "../../../domain/model/appointment/Appointment";
import { ClickTTService } from "../../../domain/service/ClickTTService";

export class ClickTTServiceImpl implements ClickTTService {
    downloadAppointments(): Set<Appointment> {
        throw new Error("Method not implemented.");
    }

}