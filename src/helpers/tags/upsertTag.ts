import { getRepository } from "typeorm";
import { Tags } from "../../entities/Tags";

export default async function upsertTags(tags: string[]): Promise<Tags[]> {
  const formattedTags = tags?.map((t) => t?.toLowerCase()?.trim())?.filter((t) => t?.length > 2);

  if (formattedTags?.length) {
    await getRepository(Tags).upsert(
      formattedTags.map((t) => ({ tag: t })),
      {
        conflictPaths: ["tag"],
        skipUpdateIfNoValuesChanged: true,
      },
    );

    const newTags = await getRepository(Tags)
      .createQueryBuilder("tags")
      .select("tags")
      .where("tags.tag IN (:...tags)", { tags: formattedTags })
      .getMany();

    return newTags;
  }

  return [];
}
