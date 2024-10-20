import validator from 'validator';
import bcrypt from 'bcrypt'
import userModel from '../models/userModel.js';
import jwt from 'jsonwebtoken'
import { v2 as cloudinary } from 'cloudinary'
import doctorModel from '../models/doctorModel.js';
import appointmentModel from '../models/appointmentMode.js';
import razorpay from 'razorpay'



// API to register user
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        console.log({ name, email, password });
        if (!name || !email || !password) {
            return res.json({ success: false, message: "Please fill all fields" });
        }
        // validating email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Enter a valid email" });
        }

        //  validating password format
        if (password.length < 8) {
            return res.json({ success: false, message: "Password should be at least 8 characters long" });
        }

        // hashing password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const userData = {
            name,
            email,
            password: hashedPassword
        }
        const newUser = new userModel(userData);
        const user = await newUser.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY)

        res.json({ success: true, token });


    } catch (err) {
        console.log(err);
        res.json({ success: false, message: err.message });
    }
}

// API to login user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.json({ success: false, message: "Please fill all fields" });
        }
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY)
            res.json({ success: true, token });
        } else {
            return res.json({ success: false, message: "Incorrect password" });
        }

    } catch (err) {
        console.log(err);
        res.json({ success: false, message: err.message });
    }
}

// API to get user profile Data:
const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.body;
        const userData = await userModel.findById(userId).select('-password');
        res.json({ success: true, userData });
    } catch (err) {
        console.log(err);
        res.json({ success: false, message: err.message });
    }
}

// API to update user profile data:
const updateUserProfile = async (req, res) => {
    try {
        const { userId, name, phone, address, dob, gender } = req.body;
        const imageFile = req.file

        if (!name || !phone || !address || !dob || !gender) {
            return res.json({ success: false, message: "Please fill all fields" });
        }

        await userModel.findByIdAndUpdate(userId, { name, phone, address: JSON.parse(address), dob, gender });

        if (imageFile) {
            //upload image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' })
            const imageUrl = imageUpload.secure_url

            //update user profile with image url
            await userModel.findByIdAndUpdate(userId, { image: imageUrl })
        }

        res.json({ success: true, message: 'Profile updated' });

    } catch (err) {
        console.log(err);
        res.json({ success: false, message: err.message });
    }
}


// API to book appointment:
const bookAppointment = async (req, res) => {
    try {

        const { userId, docId, slotDate, slotTime } = req.body;

        const docData = await doctorModel.findById(docId).select('-password');

        if (!docData.available) {
            return res.json({ success: false, message: 'Doctor not Available' });
        }

        let slots_booked = docData.slots_booked;

        // checking for slot availablity
        if (slots_booked[slotDate]) {
            if (slots_booked[slotDate].includes(slotTime)) {
                return res.json({ success: false, message: 'Slot not available' });
            } else {
                slots_booked[slotDate].push(slotTime);
            }
        } else {
            slots_booked[slotDate] = [];
            slots_booked[slotDate].push(slotTime);
        }

        const userData = await userModel.findById(userId).select('-password')

        delete docData.slots_booked

        const appointmentData = {
            userId,
            docId,
            userData,
            docData,
            amount: docData.fess,
            slotTime,
            slotDate,
            date: Date.now()

        }

        const newAppointment = new appointmentModel(appointmentData);
        await newAppointment.save();

        // save new slots data in docData
        await doctorModel.findByIdAndUpdate(docId, { slots_booked })

        res.json({ success: true, message: 'Appointment booked successfully' });


    } catch (e) {
        console.log(e)
        res.json({ success: false, message: 'Error while booking appointment' })
    }
}


// API to get user appointment data for frontend my-appointment page
const listAppointment = async (req, res) => {
    try {
        const { userId } = req.body;
        const appointments = await appointmentModel.find({ userId })
        res.json({ success: true, appointments });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to cancel appointment

const cancelAppointment = async (req, res) => {
    try {
        const { userId, appointmentId } = req.body;

        const appointmentData = await appointmentModel.findById(appointmentId)

        // verify appointment user:
        if (appointmentData.userId !== userId) {
            return res.json({ success: false, message: 'Unauthorized user' });
        }

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

// const razorpayInstance = new razorpay({
//     key_id: 'process.env.RAZORPAY_KEY_ID',
//     key_secret: 'process.env.RAZORPAY_KEY_SECRET',
//     // currency: 'INR'  // set your currency here
// })

// // API to make payment of appointment using razorpay:
// const paymentRazorpay = async (req, res) => {

//     try {
//         const { appointmentId } = req.body;
//         const appointmentData = await appointmentModel.findById(appointmentId)

//         if (!appointmentData || appointmentData.cancelled) {
//             return res.json({ success: false, message: 'Appointment Cancelled or not found' });
//         }

//         // creating options for razorpay payment
//         const options = {
//             amount: appointmentData.amount * 100,  // amount in paise
//             currency: 'INR',
//             receipt: appointmentId,
//             // payment_capture: 1 // auto capture
//         }
//         // creating order in razorpay and getting payment link
//         const order = await razorpayInstance.orders.create(options)
//         res.json({ success: true, order })
//     } catch (e) {
//         console.log(e)
//         res.json({ success: false, message: 'Error while making payment' })
//     }

// }

const payment = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId)

        if (!appointmentData || appointmentData.cancelled) {
            return res.json({ success: false, message: 'Appointment Cancelled or not found' });
        }
        // Generate a mock payment ID (could be a random string)
        const paymentId = `PAY_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        // Save the mock payment ID to the appointment
        appointmentData.paymentId = paymentId;
        await appointmentData.save();

        // Return the mock payment ID to the frontend for further verification
        res.json({ success: true, paymentId, message: 'Payment initiated' });

    } catch (e) {
        console.log(e)
        res.json({ success: false, message: 'Error while making payment' })
    }
}

const verifyPayment = async (req, res) => {
    try {
        const { paymentId, appointmentId } = req.body;

        // Check if appointmentId or paymentId is missing
        if (!appointmentId || !paymentId) {
            return res.status(400).json({ success: false, message: 'Appointment ID and Payment ID are required' });
        }

        // Fetch appointment data based on appointmentId
        const appointmentData = await appointmentModel.findById(appointmentId);

        // Check if the appointment exists and if the paymentId matches
        if (!appointmentData) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        if (appointmentData.paymentId !== paymentId) {
            return res.status(400).json({ success: false, message: 'Invalid payment ID' });
        }

        // Check if the appointment is already marked as paid
        if (appointmentData.payment) {
            return res.status(400).json({ success: false, message: 'Appointment is already paid' });
        }

        // Mark the appointment as paid
        appointmentData.payment = true;
        await appointmentData.save();

        return res.json({ success: true, message: 'Payment verified and appointment updated' });

    } catch (error) {
        console.error('Error verifying payment:', error);
        return res.status(500).json({ success: false, message: 'Error while verifying payment' });
    }
};


export { registerUser, loginUser, getUserProfile, updateUserProfile, bookAppointment, listAppointment, cancelAppointment, payment, verifyPayment }