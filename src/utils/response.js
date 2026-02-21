const response = (res) => {
    return ({
        statusCode = 200,
        status = "success",
        message = "Success",
        data = null,
    }) => {
        return res.status(statusCode).json({
            message,
            status,
            data,
        });
    };
};

export default response;