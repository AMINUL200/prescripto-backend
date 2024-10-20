import validator from "validator";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js"
import jwt from 'jsonwebtoken'
import appointmentModel from "../models/appointmentMode.js";
import userModel from "../models/userModel.js";

//api for adding doctor
const addDoctor = async (req, res) => {
    try {

        const { name, email, password, speciality, degree, experience, about, fess, address } = req.body;
        const imageFile = req.file

        // console.log({name, email, password, speciality, degree, experience, about, fess, address}, imageFile);

        // checking for all data to add doctor
        if (!name || !email || !password || !speciality || !degree || !experience || !about || !fess || !address) {
            return res.json({ success: false, message: "Missing Details" });
        }

        // validating email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }

        // validating password strength
        if (password.length < 8) {
            return res.json({ success: false, message: "Password should be at least 8 characters long" });
        }

        // hashing password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Upload image to Cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
            resource_type: 'image',
            folder: 'doctor_images', // Optional: you can specify a folder in Cloudinary
        });
        const imageUrl = imageUpload.secure_url;

        // creating new doctor object
        const newDoctor = new doctorModel({
            name,
            email,
            password: hashedPassword,
            speciality,
            degree,
            experience,
            about,
            fess,
            address: JSON.parse(address),
            date: Date.now(),
            image: imageUrl
        });

        // saving doctor to database
        await newDoctor.save();
        res.json({ success: true, message: "Doctor added successfully" });



    } catch (err) {
        console.log(err);
        res.json({ success: false, message: err.message });

    }
}


// API for admin Login
const adminLogin = async (req, res) => {
    try {

        const { email, password } = req.body;

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {

            const token = jwt.sign(email+password, process.env.JWT_SECRET_KEY);
            res.json({ success: true, message: "Admin logged in successfully", token });

        } else {
            return res.json({ success: false, message: "Invalid email or password for ADMIN Login" });
        }

    } catch (err) {
        console.log(err);
        res.json({ success: false, message: err.message });
    }
}

// Api to get all doctors list for admin panel
const allDoctors = async(req, res) =>{

    try {
        const doctors = await doctorModel.find({}).select('-password')
        res.json({ success: true,  doctors });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }

}

// api to get all appoinements list
const appointmentsAdmin = async(req, res) =>{
    try{

        const appointments = await appointmentModel.find({});
        res.json({ success: true, appointments });

    }catch (error){
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API for appointment cancellation:

const appointmentCancel = async (req, res) => {
    try {
        const {  appointmentId } = req.body;

        const appointmentData = await appointmentModel.findById(appointmentId)

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

        // releasing doctor slot:
        const { docId, slotDate, slotTime } = appointmentData
        const doctorData = await doctorModel.findById(docId)

        let slots_booked = doctorData.slots_booked;

        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)

        await doctorModel.findByIdAndUpdate(docId, { slots_booked })

        res.json({ success: true, message: "Appointment Cancelled" })


    } catch (e) {
        console.log(e)
        res.json({ success: false, message: 'Error while canceling appointment' })
    }
}

// API to get dashboard data for admin panel:
const adminDashboard = async(req, res) =>{

    try{
        const totalAppointments = await appointmentModel.find({})
        const totalDoctors = await doctorModel.find({})
        const totalUsers = await userModel.find({})

        const dashData = {
            appointments: totalAppointments.length,
            doctors: totalDoctors.length,
            patients: totalUsers.length,
            latestAppointments: totalAppointments.reverse().slice(0, 5)
           
        }
        res.json({ success: true, dashData });

    }catch(error){
        console.log(error);
        res.json({ success: false, message: error.message });
    }

}

export { addDoctor, adminLogin , allDoctors, appointmentsAdmin, appointmentCancel, adminDashboard}