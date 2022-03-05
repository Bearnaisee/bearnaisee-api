import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Ingredients } from "./Ingredients";
import { Metrics } from "./Metrics";
import { Recipes } from "./Recipes";

@Index("recipe_has_ingredients_recipe_id_ingredient_id_metric_id_key", ["ingredientId", "metricId", "recipeId"], {
  unique: true,
})
@Entity("recipe_has_ingredients", { schema: "public" })
export class RecipeHasIngredients {
  @PrimaryColumn("integer", { name: "recipe_id", unique: true })
  recipeId: number;

  @PrimaryColumn("integer", { name: "ingredient_id", unique: true })
  ingredientId: number;

  @PrimaryColumn("integer", { name: "metric_id", unique: true })
  metricId: number;

  @Column("numeric", { name: "amount", nullable: true })
  amount: string | null;

  @ManyToOne(() => Ingredients, (ingredients) => ingredients.recipeHasIngredients)
  @JoinColumn([{ name: "ingredient_id", referencedColumnName: "id" }])
  ingredient: Ingredients;

  @ManyToOne(() => Metrics, (metrics) => metrics.recipeHasIngredients)
  @JoinColumn([{ name: "metric_id", referencedColumnName: "id" }])
  metric: Metrics;

  @ManyToOne(() => Recipes, (recipes) => recipes.recipeHasIngredients)
  @JoinColumn([{ name: "recipe_id", referencedColumnName: "id" }])
  recipe: Recipes;
}
