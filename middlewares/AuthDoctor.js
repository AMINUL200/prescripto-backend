import jwt from 'jsonwebtoken'

// Doctor authentication middleware"

const authDoctor = async (req, res, next) => {
    try {
        const { dtoken } = req.headers;
        

        if(!dtoken){
            return res.json({ success: false, message: "No token, authorization denied" });
        }

        const decoded = jwt.verify(dtoken, process.env.JWT_SECRET_KEY);

        req.body.docId = decoded.id;
        next();

    } catch(err){
        console.log(err);
        res.json({ success: false, message: "Token is not valid" });
    }
}

export default authDoctor