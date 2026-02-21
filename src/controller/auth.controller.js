
const register = (req, res) => {
    // Logic for user registration
    res.send("User registered successfully");
};

const login = (req, res) => {
    // Logic for user login
    res.send("User logged in successfully");
};

const authController = {
    register,
    login
};

export default authController;