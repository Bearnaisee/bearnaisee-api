import "reflect-metadata";
import { createConnection } from "typeorm";
import express, { Request, Response, NextFunction } from "express";
import fs from "fs";
import dotenv from "dotenv";
import os from "os";
import { dbConfig } from "./config/database";

if (process.env.NODE_ENV !== "production") dotenv.config();

const PORT = process.env.PORT || 1234;

createConnection(dbConfig)
  .then(async () => {
    const app = express();

    app.use(express.json());

    app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`${req.method} -> ${req.originalUrl}`);

      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "OPTIONS, GET, PUT, POST, DELETE");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-mac");
      res.header("Access-Control-Expose-Headers", "x-mac, x-host");

      next();
    });

    const routesPath = "./src/routes";

    fs.readdirSync(routesPath).forEach(async (filename) => {
      try {
        const route = await import(`./routes/${filename}`);

        route.default(app);

        console.log(`Imported ${filename}`);
      } catch (error) {
        console.error(`Error importing route ${filename}`, error.message);
      }
    });

    app.get("/", (_req: Request, res: Response) => {
      res.setHeader("x-host", `server-${os.hostname()}`);
      res.send("We live boys");
    });

    app.listen(PORT, () => console.log(`API listening on PORT ${PORT}!`));
  })
  .catch((error) => console.log(error));
