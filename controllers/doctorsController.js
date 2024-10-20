import doctorModel from "../models/doctorModel.js";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import appointmentModel from "../models/appointmentMode.js";

const changeAvailability = async (req, res) => {
    try {
        const { docId } = req.body;
        const docData = await doctorModel.findById(docId);
        await doctorModel.findByIdAndUpdate(docId, { available: !docData.available });

        res.json({ success: true, message: "Availability changed successfully" });
    } catch (err) {
        console.log(err);
        res.json({ success: false, message: err.message });
    }
}

const doctorList = async (req, res) => {
    try {
        const doctors = await doctorModel.find({}).select(['-password', '-email']);
        res.json({ success: true, doctors });
    } catch (err) {
        console.log(err);
        res.json({ success: false, message: "Please select" });
    }
}

// API for doctor login :

const loginDoctor = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.json({ success: false, message: "Please fill all fields" });
        }
        const doctor = await doctorModel.findOne({ email });

        if (!doctor) {
            return res.json({ success: false, message: "Email or password is incorrect" });
        }

        const isMatch = await bcrypt.compare(password, doctor.password);

        if (!isMatch) {
            return res.json({ success: false, message: "Email or password is incorrect" });
        }

        const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET_KEY);
        res.json({ success: true, token });


    } catch (err) {
        console.log(err);
        res.json({ success: false, message: err.message });
    }
}

// API to get doctor appointments for doctor panel;

const appointmentsDoctor = async (req, res) => {
    try {
        const { docId } = req.body;
        const appointments = await appointmentModel.find({ docId });
        res.json({ success: true, appointments });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to mark appointment completed for doctor panel

const appointmentComplete = async (req, res) => {
    try {
        const { docId, appointmentId } = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId);

        if (appointmentData && appointmentData.docId === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true });
            res.json({ success: true, message: "Appointment marked completed successfully" });
        } else {
            res.json({ success: false, message: "Mark Failed" });
        }

    } catch (err) {
        console.log(err);
        res.json({ success: false, message: err.message });
    }
}

// API to cancel appointment for doctor panel:

const cancelAppointment = async (req, res) => {
    try {
        const { docId, appointmentId } = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId);

        if (appointmentData && appointmentData.docId === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });
            res.json({ success: true, message: "Appointment cancelled successfully" });
        } else {
            res.json({ success: false, message: "Cancel Failed" });
        }

    } catch (err) {
        console.log(err);
        res.json({ success: false, message: err.message });
    }
}


// API to get DashBoard data for doctor panel:
const doctorDashboard = async (req, res) => {
    try {
        const { docId } = req.body;
        const totalAppointments = await appointmentModel.find({ docId });

        let earnings = 0;
        totalAppointments.map((item) => {
            if (item.isCompleted || item.payment) {
                earnings += item.amount;
            }
        })

        let patients = [];

        totalAppointments.map((item) => {
            if (!patients.includes(item.userId)) {
                patients.push(item.userId);
            }
        })

        const dashData = {
            earnings,
            appointments: totalAppointments.length,
            patients: patients.length,
            latestAppointments: totalAppointments.reverse().slice(0, 5)
        }

        res.json({ success: true, dashData });

    } catch (err) {
        console.log(err);
        res.json({ success: false, message: err.message });

    }
}

// API to get doctor profile for doctor panel:

const doctorProfile = async (req, res) => {
    try {
        const { docId } = req.body;
        const doctorData = await doctorModel.findById(docId).select('-password');

        res.json({ success: true, doctorData });

    } catch (err) {
        console.log(err);
        res.json({ success: false, message: err.message });

    }
}

// API to update doctor profile for doctor panel:

const updateDoctorProfile = async (req, res) => {
    try {
        const { docId, fess, address, available } = req.body;
        await doctorModel.findByIdAndUpdate(docId, { fess, address, available })

        res.json({ success: true, message: "Profile Updated" });

    } catch (err) {
        console.log(err);
        res.json({ success: false, message: err.message });

    }
}

export {
    changeAvailability,
    doctorList,
    loginDoctor,
    appointmentsDoctor,
    appointmentComplete,
    cancelAppointment,
    doctorDashboard,
    doctorProfile,
    updateDoctorProfile,
};
