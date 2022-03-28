import { getConnection, getRepository } from "typeorm";
import { Ingredients } from "../../entities/Ingredients";
import { Metrics } from "../../entities/Metrics";
import { RecipeHasIngredients } from "../../entities/RecipeHasIngredients";
import { Recipes } from "../../entities/Recipes";

export async function deleteExistingIngredients(recipeId: Recipes["id"]) {
  await getConnection()
    .createQueryBuilder()
    .delete()
    .from(RecipeHasIngredients)
    .where("recipeId = :recipeId", {
      recipeId,
    })
    .execute();
}

export default async function createRecipeIngredients(
  recipe: Recipes,
  ingredients: {
    amount: RecipeHasIngredients["amount"];
    metricId: Metrics["id"];
    ingredient: Ingredients["ingredient"];
  }[],
) {
  await deleteExistingIngredients(recipe.id);

  const formattedIngredients = ingredients
    ?.map((i) => ({
      ...i,
      ingredient: i?.ingredient?.toLowerCase()?.trim(),
    }))
    ?.filter((i) => i?.ingredient?.length > 0);

  if (formattedIngredients?.length) {
    formattedIngredients.forEach(async (ingredient) => {
      await getRepository(Ingredients).upsert(
        { ingredient: ingredient.ingredient },
        {
          conflictPaths: ["ingredient"],
          skipUpdateIfNoValuesChanged: true,
        },
      );

      const newIngredient = await getRepository(Ingredients)
        .createQueryBuilder("ingredients")
        .select("ingredients.id")
        .where("ingredient = :ingredient", { ingredient: ingredient.ingredient })
        .getOne();

      if (newIngredient?.id) {
        const newRecipeIngredient = getRepository(RecipeHasIngredients).create({
          recipe,
          metricId: ingredient.metricId,
          amount: ingredient.amount,
          ingredientId: newIngredient?.id,
        });

        await getRepository(RecipeHasIngredients).save(newRecipeIngredient);
      }
    });
  }
}
