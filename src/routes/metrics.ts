import { Application, Request, Response } from "express";
import { getRepository } from "typeorm";
import { Metrics } from "../entities/Metrics";

export default (server: Application) => {
  server.get("/metrics", async (_req: Request, res: Response) => {
    const metrics = await getRepository(Metrics).find();

    res.status(200).send({
      metrics,
    });
  });
};
