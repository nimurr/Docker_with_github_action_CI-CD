import joi from "joi";

const register = joi.object({
    name: joi.string().required(),
    email: joi.string().required(),
    password: joi.string().required(),
});

const login = joi.object({
    email: joi.string().required(),
    password: joi.string().required(),
});

const authValidation = {
    register,
    login
};

export default authValidation;
