import {Appointment, AppointmentFactory} from "../../../../src/domain/model/appointment/Appointment";

describe('Create Appointment Factory', () => {
    it('should have a title equal to "local - foreign" team name', () => {
        // when
        const actualAppointment: Appointment = AppointmentFactory.create('local', 'remote', '01.01.1970 00:00');

        // then
        expect(actualAppointment.title).toEqual("local - remote");
    })

    it('should parse the start date time', () => {
        // when
        const actualAppointment: Appointment = AppointmentFactory.create('local', 'remote', '01.01.1970 00:00');

        // then
        expect(actualAppointment.startDateTime.toEpochSecond).toEqual(7);
    })
})