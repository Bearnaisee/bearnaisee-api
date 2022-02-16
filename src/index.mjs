import express from "express";
import dotenv from "dotenv";
import fs from "fs";

if (process.env.NODE_ENV !== "production") dotenv.config();

const PORT = process?.env?.PORT || 5000;

const app = express();

app.use(express.json());

app.use((req, res, next) => {
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

app.get("/", (req, res) => {
  res.status(200).send("We are running successfully");
});

app.listen(PORT, () => console.log(`API listening on port ${PORT}!`));
