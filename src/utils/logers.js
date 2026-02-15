// loger middlewire 

const logger = (req, res, next) => {
    const time = new Date().toLocaleString();

    console.log(`${req.method}- ${req.url}---- Date:-${time}`);
    next();
}

export default logger