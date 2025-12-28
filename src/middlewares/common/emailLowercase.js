export const emailToLowerCase = (req,res,next) => {
    try {
        if(req.body?.email && typeof req.body.email==="string") {
            req.body.email = req.body.email.trim().toLowerCase();
        }
        if(req.query?.email && typeof req.query.email==="string") {
            req.query.email = req.query.email.trim().toLowerCase();
        }
        next();
    } catch(err) {
        console.log(err);
        next();
    }
}