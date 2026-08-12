import "dotenv/config";
import { startServer } from "./server";
import { config } from "./config";

startServer(config).catch((err) => {
  console.error(err);
  process.exit(1);
});