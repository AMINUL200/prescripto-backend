import jwt from 'jsonwebtoken';

// admin authentication middleware
const authAdmin = async (req, res, next) => {
    try {
        // const { atoken } = req.headers;
        // console.log("aToken",req.headers.authorization);
        // console.log(atoken);

        const authorizationHeader = req.headers.authorization;
        // console.log("Auth-:", authorizationHeader);
        
        const atoken = authorizationHeader.split(' ')[1];
        // console.log("final token:", atoken);
        
        
        if (!atoken) {
            return res.json({ status: false, message: "Not Authorized Login Again" });
        }
     

        const token_decode = jwt.verify(atoken, process.env.JWT_SECRET_KEY)
        if (token_decode !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
            return res.json({ status: false, message: "Authentication Failed" });
        }

        next();
    } catch (error) {
        console.log(error);
        res.status(401).json({ message: 'Not authorized to access this resource' });
    }
}

export default authAdmin;