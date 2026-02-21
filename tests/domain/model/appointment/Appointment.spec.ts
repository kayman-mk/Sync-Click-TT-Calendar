import { LocalDate, LocalTime, LocalDateTime } from "@js-joda/core";
import { Appointment, AppointmentFactory } from "../../../../src/domain/model/Appointment";

const startDateTime = LocalDateTime.of(LocalDate.of(2023, 1, 1), LocalTime.of(20, 15, 0));

describe('Appointment Factory: from CSV', () => {
    it('should have a title equal to "local - foreign [age]"', () => {
        // when
        const actualAppointment = AppointmentFactory.createFromCsv({
            localTeam: 'local',
            foreignTeam: 'remote',
            startDateTime,
            subLeague: '3. KK West',
            matchNumber: 5,
            location: 'location',
            ageClass: 'age',
            isCup: true,
            round: 'Pokal'
        });
        // then
        expect(actualAppointment.title).toEqual("local - remote [age]");
    })

    it('should build the ID from subLeague and match number', () => {
        // when
        const actualAppointment = AppointmentFactory.createFromCsv({
            localTeam: 'local',
            foreignTeam: 'remote',
            startDateTime,
            subLeague: '3. KK West',
            matchNumber: 5,
            location: 'location',
            ageClass: 'age',
            isCup: true,
            round: 'Pokal'
        });
        // then
        expect(actualAppointment.id).toEqual("ID: 3. KK West-5-Pokal-2023");
    })
})

describe('AppointmentFactory: from calendar entry', () => {
    it('should extract cup information from category "Pokal"', () => {
        //when
        const actualAppointment = AppointmentFactory.createFromCalendar("A - B (age)", startDateTime, "ID: subleague-4-Pokal-2023", "location", ["Click-TT", "Pokal"])

        //then
        expect(actualAppointment.isCup).toBeTruthy()
    })

    it('should accept Click-TT appointments only', () => {
        //when
        const actualCreator = () => {
            AppointmentFactory.createFromCalendar("A - B (age)", startDateTime, "ID: subleague-4-Pokal-2023", "location", ["Pokal"])
        }

        //then
        expect(actualCreator).toThrowError();
    })

    it('should extract the age class from summary', () => {
        //when
        const actualAppointment = AppointmentFactory.createFromCalendar("A (SG) - B [age]", startDateTime, "ID: subleague-4-Pokal-2023", "location", ["Click-TT", "Pokal"])

        //then
        expect(actualAppointment.ageClass).toEqual("age");
    })

    it('should extract the event id from the description', () => {
        //when
        const actualAppointment = AppointmentFactory.createFromCalendar("A (SG) - B (age)", startDateTime, "Some text here\nand there\nID: subleague-4-Pokal-2023\nsome more", "location", ["Click-TT", "Pokal"])

        //then
        expect(actualAppointment.id).toEqual("ID: subleague-4-Pokal-2023");
    })
})

describe('Appointment', () => {
    it('should assign category "Pokal" to cup games', () => {
        // when
        const actualAppointment = new Appointment('title', startDateTime, 'location', true, 'age', ["Click-TT", "Pokal", "age"], "", 0, 'ID: a-5-Liga-2023')

        // then
        expect(actualAppointment.categories).toContain("Pokal")
    })

    it('should assign category "Liga" to non cup games', () => {
        // when
        const actualAppointment = new Appointment('title', startDateTime, 'location', false, 'age', ["Click-TT", "Liga", "age"], "", 0, "", 'ID: a-5-Liga-2023')

        // then
        expect(actualAppointment.categories).toContain("Liga")
    })

    it('should always assign Click-TT category', () => {
        // when
        const actualAppointment = new Appointment('title', startDateTime, 'location', true, 'age', ["Click-TT", "Pokal", "age"], "", 0, "", 'ID: a-5-Pokal-2023')

        // then
        expect(actualAppointment.categories).toContain("Click-TT")
    })

    it('should assign the ageClass as category', () => {
        // when
        const actualAppointment = new Appointment('title', startDateTime, 'location', true, 'age', ["Click-TT", "Pokal", "age"], "", 0, "", 'ID: a-5-Pokal-2023')

        // then
        expect(actualAppointment.categories).toContain("age")
    })

    it('should identify Click-TT appointment based on the category', () => {
        // when
        const actualResult = Appointment.isFromClickTT(["Click-TT"])

        // then
        expect(actualResult).toBeTruthy();
    })

    it('should not identify appointment as Click-TT relevant if Click-TT category is missing', () => {
        // when
        const actualResult = Appointment.isFromClickTT(["abc"])

        // then
        expect(actualResult).toBeFalsy();
    })

    it('should report objects as same', () => {
        // given
        const givenAppointment1 = new Appointment('title', startDateTime, 'location', true, 'age', ["Jugend"], "", 0, "", 'ID: a-5-Pokal-2023')
        const givenAppointment2 = new Appointment('title', startDateTime, 'location', true, 'age', ["Jugend"], "", 0, "", 'ID: a-5-Pokal-2023')

        // when
        const actualIsSameAs = givenAppointment1.isSameAs(givenAppointment2);

        // then
        expect(actualIsSameAs).toBeTruthy()
    })

    it('should identify a modified appointment if title changed', () => {
        // given
        const givenAppointment1 = new Appointment('title 1', startDateTime, 'location', true, 'age', [], "", 0, "", 'ID: a-5-Pokal-2023')
        const givenAppointment2 = new Appointment('title 2', startDateTime, 'location', true, 'age', [], "", 0, "", 'ID: a-5-Pokal-2023')

        // when
        const actualIsSameAs = givenAppointment1.isSameAs(givenAppointment2);

        // then
        expect(actualIsSameAs).toBeFalsy()
    })

    it('should identify a modified appointment if date/time changed', () => {
        // given
        const givenAppointment1 = new Appointment('title', startDateTime, 'location', true, 'age', [], "", 0, "", 'ID: a-5-Pokal-2023')
        const givenAppointment2 = new Appointment('title', startDateTime.plusDays(1), 'location', true, 'age', [], "", 0, "", 'ID: a-5-Pokal-2023')

        // when
        const actualIsSameAs = givenAppointment1.isSameAs(givenAppointment2);

        // then
        expect(actualIsSameAs).toBeFalsy()
    })

    it('should identify a modified appointment if location changed', () => {
        // given
        const givenAppointment1 = new Appointment('title', startDateTime, 'location 1', true, 'age', [], "", 0, "", 'ID: a-5-Pokal-2023',)
        const givenAppointment2 = new Appointment('title', startDateTime, 'location 2', true, 'age', [], "", 0, "", 'ID: a-5-Pokal-2023',)

        // when
        const actualIsSameAs = givenAppointment1.isSameAs(givenAppointment2);

        // then
        expect(actualIsSameAs).toBeFalsy()
    })

    it('should identify a modified appointment if age class changed', () => {
        // given
        const givenAppointment1 = new Appointment('title', startDateTime, 'location', true, 'age 1', [], "", 0, "", 'ID: a-5')
        const givenAppointment2 = new Appointment('title', startDateTime, 'location', true, 'age 2', [], "", 0, "", 'ID: a-5')

        // when
        const actualIsSameAs = givenAppointment1.isSameAs(givenAppointment2);

        // then
        expect(actualIsSameAs).toBeFalsy()
    })

    it('should not compare appointments based on different Click-TT appointments', () => {
        //when
        const actualComparator = () => {
            // given
            const givenAppointment1 = new Appointment('title', startDateTime, 'location', true, 'age', [], "", 0, "", 'ID: a-5-Pokal-2023')
            const givenAppointment2 = new Appointment('title', startDateTime, 'location', true, 'age', [], "", 0, "", 'ID: a-6-Pokal-2023')

            // when
            givenAppointment1.isSameAs(givenAppointment2)
        }

        //then
        expect(actualComparator).toThrowError();
    })

    it('should return a string representation with all key fields', () => {
        // given
        const appointment = new Appointment(
            'Test Match',
            startDateTime,
            'Test Location',
            true,
            'U18',
            ['Click-TT', 'Pokal', 'U18'],
            "",
            0,
            "",
            'ID: test-1-2023'
        );
        // when
        const str = appointment.toString();
        // then
        expect(str).toContain('Test Match');
        expect(str).toContain('ID: test-1-2023');
        expect(str).toContain('Test Location');
        expect(str).toContain('isCup=true');
        expect(str).toContain('U18');
        expect(str).toContain('Click-TT');
        expect(str).toContain('Pokal');
    });
})
