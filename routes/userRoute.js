import express from 'express';
import { registerUser, loginUser, getUserProfile, updateUserProfile, bookAppointment, listAppointment, cancelAppointment, payment, verifyPayment } from '../controllers/userController.js';
import authUser from '../middlewares/AuthUser.js';
import upload from '../middlewares/multer.js';

const userRouter = express.Router();

userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);

userRouter.get('/get-profile',authUser, getUserProfile);

userRouter.post('/update-profile', upload.single('image'), authUser, updateUserProfile)
userRouter.post('/book-appointment', authUser, bookAppointment)
userRouter.get('/appointments' ,authUser, listAppointment)
userRouter.post('/cancel-appointment', authUser, cancelAppointment)
userRouter.post('/payment', authUser, payment);
userRouter.post('/verify-payment', authUser, verifyPayment);

export default userRouter;