import joi from "joi";

const register = joi.object({
    fullName: joi.string().required(),
    email: joi.string().required(),
    password: joi.string().required(),
});

const login = joi.object({
    email: joi.string().required(),
    password: joi.string().required(),
});
const verifyEmail = joi.object({
    email: joi.string().required(),
    otp: joi.string().required(),
});
const resendOTP = joi.object({
    email: joi.string().required(),
});

const authValidation = {
    register,
    login,
    verifyEmail,
    resendOTP
};

export default authValidation;
