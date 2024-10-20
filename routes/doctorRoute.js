import express from "express";
import { doctorList, loginDoctor, appointmentsDoctor, appointmentComplete, cancelAppointment, doctorDashboard, doctorProfile, updateDoctorProfile } from "../controllers/doctorsController.js";
import authDoctor from "../middlewares/AuthDoctor.js";

const doctorRouter = express.Router();

// Get all doctors
doctorRouter.get('/list', doctorList)
doctorRouter.post('/login', loginDoctor)
doctorRouter.get('/appointments', authDoctor, appointmentsDoctor);
doctorRouter.post('/complete-appointment', authDoctor, appointmentComplete);
doctorRouter.post('/cancel-appointment', authDoctor, cancelAppointment);
doctorRouter.get('/dashboard', authDoctor, doctorDashboard)
doctorRouter.get('/profile', authDoctor, doctorProfile);
doctorRouter.post('/update-profile', authDoctor, updateDoctorProfile)

export default doctorRouter;