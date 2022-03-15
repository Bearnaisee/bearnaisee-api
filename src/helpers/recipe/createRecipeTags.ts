import { getConnection, getRepository } from "typeorm";
import { RecipeHasTags } from "../../entities/RecipeHasTags";
import { Recipes } from "../../entities/Recipes";
import { Tags } from "../../entities/Tags";

export async function deleteExistingRecipeTags(recipe: Recipes, tags: Tags[]) {
  await getConnection()
    .createQueryBuilder()
    .delete()
    .from(RecipeHasTags)
    .where("recipe_id = :recipeId", { recipeId: recipe.id })
    .andWhere("tag_id NOT IN (:...tagIds)", {
      tagIds: tags?.map((t) => t?.id),
    })
    .execute();
}

export default async function createRecipeTags(recipe: Recipes, tags: Tags[]) {
  await deleteExistingRecipeTags(recipe, tags);

  await getRepository(RecipeHasTags).upsert(
    tags.map((tag) => ({
      recipe,
      tag,
    })),
    {
      conflictPaths: ["recipeId", "tagId"],
      skipUpdateIfNoValuesChanged: true,
    },
  );
}
