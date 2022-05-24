import { getConnection, getRepository } from "typeorm";
import { Recipes } from "../../entities/Recipes";
import { RecipeSteps } from "../../entities/RecipeSteps";

export async function deleteExistingRecipeSteps(recipeId: Recipes["id"]) {
  await getConnection()
    .createQueryBuilder()
    .delete()
    .from(RecipeSteps)
    .where("recipe_id = :recipeId", {
      recipeId,
    })
    .execute();
}

export default async function createRecipeSteps(
  recipe: Recipes,
  steps: { recipeId?: number; content: string; step?: number; optional?: boolean }[],
) {
  await deleteExistingRecipeSteps(recipe.id);

  const filteredSteps: { recipeId?: number; content: string; step?: number; optional?: boolean }[] = steps?.filter(
    (s) => s?.content?.length > 0,
  );

  if (filteredSteps?.length) {
    filteredSteps.forEach(async (step, i) => {
      const newStep = getRepository(RecipeSteps).create({
        recipe,
        step: i + 1,
        content: step?.content,
        optional: step?.optional || false,
      });

      await getRepository(RecipeSteps).save(newStep);
    });
  }
}
