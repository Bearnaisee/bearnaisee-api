import { Application, Request, Response } from "express";

export default (server: Application) => {
  server.post("/user/login", async (req: Request, res: Response) => {
    if (req?.body?.email && req?.body?.password) {
      // do whatever you wanna do

      if (req.body.email === "mh@cavea.io" && req.body.password === "asd") {
        res.status(200).send({
          msg: "Login succesfully",
          login: true,
        });
      } else {
        res.status(404).send({
          msg: "Wrong email/password",
          login: false,
        });
      }
    } else {
      res.status(400).send({
        msg: "Missing data",
        login: false,
      });
    }
  });
};
