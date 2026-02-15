import redis from "redis";
import config from "../config/config.js";

const redisClient = redis.createClient({
    url: config.redisUrl || "redis://127.0.0.1:6379",
});

redisClient.on("error", (err) => {
    console.error("Redis Error:", err);
});

(async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
})();

const setRedis = async (key, value, ttl = 300) => {
    await redisClient.set(key, JSON.stringify(value), { EX: ttl });
};

const getRedis = async (key) => {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
};

const delRedis = async (key) => {
    await redisClient.del(key);
};

export { setRedis, getRedis, delRedis };
