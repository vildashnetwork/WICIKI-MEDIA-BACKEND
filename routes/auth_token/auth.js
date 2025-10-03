const generateToken = (useremial) => {

    return jwt.sign({ useremial }, JWT_SECRET, { expiresIn: "15d" });

};
export default generateToken