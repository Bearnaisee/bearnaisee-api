import { getRepository } from "typeorm";
import { Application, Request, Response } from "express";
import { hashString, verifyHash } from "../helpers/hashing";
import { Users } from "../entities/Users";

export default (server: Application) => {
  server.post("/user/create", async (req: Request, res: Response) => {
    if (!req?.body?.username?.trim()?.length || !req?.body?.email?.trim()?.length || !req?.body?.password?.length) {
      res.status(400).send({ msg: "Missing data", successful: false });
      return;
    }

    const hashedPassword = await hashString(req.body.password);
    const passwordVerification = await verifyHash(hashedPassword, req.body.password);

    if (!hashedPassword || !passwordVerification) {
      res.status(500).send({ msg: "Something went wrong hashing password", successful: false });
      return;
    }

    const userRepository = getRepository(Users);

    const existingUsers = await userRepository
      .createQueryBuilder("user")
      .where("user.email = :email OR user.username = :username")
      .setParameters({
        email: req.body.email.toLowerCase().trim(),
        username: req.body.username.toLowerCase().trim(),
      })
      .getMany();

    if (existingUsers?.length) {
      res.status(409).send({
        msg: "Username or email already in use",
        successful: false,
        usernameTaken: existingUsers.findIndex((u) => u.username === req.body.username.toLowerCase().trim()) !== -1,
        emailTaken: existingUsers.findIndex((u) => u.email === req.body.email.toLowerCase().trim()) !== -1,
      });
      return;
    }

    const user = new Users();

    await userRepository
      .save({
        ...user,
        username: req.body.username.toLowerCase().trim(),
        email: req.body.email.toLowerCase().trim(),
        password: hashedPassword,
        role_id: 1,
      })
      .then((result) =>
        res.status(200).send({
          msg: "Created new user succesfully",
          successful: true,
          user: {
            ...result,
            password: undefined,
            bannedAt: undefined,
          },
        }),
      )
      .catch((error) => {
        console.error("Something went wrong creating user", error);
        res.status(500).send({
          msg: "Something went wrong creating user",
          successful: false,
          error,
        });
      });
  });

  server.post("/user/login", async (req: Request, res: Response) => {
    if (!req?.body?.email?.trim()?.length || !req?.body?.password?.length) {
      res.status(400).send({ msg: "Missing data", successful: false });
      return;
    }

    const userRepository = getRepository(Users);

    const user = await userRepository.findOne({
      email: req.body.email.toLowerCase().trim(),
    });

    if (user) {
      const correctPassword = await verifyHash(user.password, req.body.password);

      if (correctPassword) {
        res.status(200).send({
          msg: "Logged in successful",
          user: {
            ...user,
            password: undefined,
            bannedAt: undefined,
          },
          successful: true,
        });
        return;
      }

      res.status(400).send({ msg: "Wrong password", successful: false });
      return;
    }

    res.status(404).send({ msg: "User not found", successful: false });
  });
};
