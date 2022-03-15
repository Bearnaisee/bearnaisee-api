import { Application, Request, Response } from "express";
import { getRepository } from "typeorm";
import { Tags } from "../entities/Tags";
import upsertTags from "../helpers/tags/upsertTag";

export default (server: Application) => {
  server.get("/tags", async (_req: Request, res: Response) => {
    const tags = await getRepository(Tags).find();

    res.status(200).send({ tags });
  });

  server.post("/tags", async (req: Request, res: Response) => {
    const result = await upsertTags(req?.body?.tags);

    res.status(200).send({
      result,
    });
  });
};
