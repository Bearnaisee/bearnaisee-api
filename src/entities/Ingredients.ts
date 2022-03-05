import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { RecipeHasIngredients } from "./RecipeHasIngredients";

@Index("ingredients_pkey", ["id"], { unique: true })
@Index("ingredients_ingredient_key", ["ingredient"], { unique: true })
@Entity("ingredients", { schema: "public" })
export class Ingredients {
  @PrimaryGeneratedColumn({ type: "integer", name: "id" })
  id: number;

  @Column("character varying", {
    name: "ingredient",
    unique: true,
    length: 255,
  })
  ingredient: string;

  @OneToMany(() => RecipeHasIngredients, (recipeHasIngredients) => recipeHasIngredients.ingredient)
  recipeHasIngredients: RecipeHasIngredients[];
}
