import mysql, { PoolOptions } from "mysql2/promise";

const poolConfig: PoolOptions = {
  host: "14.7.33.34",
  user: "root",
  password: "gl0ssyell",
  //database: "target-marketing", // 실서버
  database: "target-marketing-dev",
  waitForConnections: true,
  connectionLimit: 10,
};

const pool = mysql.createPool(poolConfig);

const isDevDB = poolConfig.database?.endsWith("_dev") ?? false;

export { isDevDB };
export default pool;