import { getRepository } from "typeorm";
import { Ingredients } from "../../entities/Ingredients";

export default async function upsertIngredients(ingredients: string[]): Promise<Ingredients[]> {
  const formattedIngredients = ingredients?.map((i) => i?.toLowerCase()?.trim())?.filter((i) => i?.length > 2);

  if (formattedIngredients?.length) {
    await getRepository(Ingredients).upsert(
      formattedIngredients.map((i) => ({ ingredient: i })),
      {
        conflictPaths: ["ingredient"],
        skipUpdateIfNoValuesChanged: true,
      },
    );

    const newIngredients = await getRepository(Ingredients)
      .createQueryBuilder("ingredients")
      .select("ingredients")
      .where("ingredients.ingredient IN (:...ingredients)", { ingredients: formattedIngredients })
      .getMany();

    return newIngredients;
  }

  return [];
}
