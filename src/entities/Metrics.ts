import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { RecipeHasIngredients } from "./RecipeHasIngredients";

@Index("metrics_pkey", ["id"], { unique: true })
@Index("metrics_metric_key", ["metric"], { unique: true })
@Entity("metrics", { schema: "public" })
export class Metrics {
  @PrimaryGeneratedColumn({ type: "integer", name: "id" })
  id: number;

  @Column("character varying", { name: "metric", unique: true, length: 255 })
  metric: string;

  @OneToMany(() => RecipeHasIngredients, (recipeHasIngredients) => recipeHasIngredients.metric)
  recipeHasIngredients: RecipeHasIngredients[];
}
