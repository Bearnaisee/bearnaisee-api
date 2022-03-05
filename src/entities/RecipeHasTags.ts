import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Recipes } from "./Recipes";
import { Tags } from "./Tags";

@Index("recipe_has_tags_recipe_id_tag_id_key", ["recipeId", "tagId"], {
  unique: true,
})
@Entity("recipe_has_tags", { schema: "public" })
export class RecipeHasTags {
  @Column("integer", { name: "recipe_id", unique: true })
  recipeId: number;

  @Column("integer", { name: "tag_id", unique: true })
  tagId: number;

  @ManyToOne(() => Recipes, (recipes) => recipes.recipeHasTags)
  @JoinColumn([{ name: "recipe_id", referencedColumnName: "id" }])
  recipe: Recipes;

  @ManyToOne(() => Tags, (tags) => tags.recipeHasTags)
  @JoinColumn([{ name: "tag_id", referencedColumnName: "id" }])
  tag: Tags;
}
