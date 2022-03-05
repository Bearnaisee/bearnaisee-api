import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Recipes } from "./Recipes";

@Index("recipe_steps_pkey", ["id"], { unique: true })
@Entity("recipe_steps", { schema: "public" })
export class RecipeSteps {
  @PrimaryGeneratedColumn({ type: "integer", name: "id" })
  id: number;

  @Column("smallint", { name: "step", nullable: true, default: () => "1" })
  step: number | null;

  @Column("boolean", {
    name: "optional",
    nullable: true,
    default: () => "false",
  })
  optional: boolean | null;

  @Column("text", { name: "content", nullable: true })
  content: string | null;

  @ManyToOne(() => Recipes, (recipes) => recipes.recipeSteps)
  @JoinColumn([{ name: "recipe_id", referencedColumnName: "id" }])
  recipe: Recipes;
}
