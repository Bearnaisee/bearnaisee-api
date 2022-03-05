import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Recipes } from "./Recipes";
import { Users } from "./Users";

@Index("recipe_comments_pkey", ["id"], { unique: true })
@Entity("recipe_comments", { schema: "public" })
export class RecipeComments {
  @PrimaryGeneratedColumn({ type: "integer", name: "id" })
  id: number;

  @Column("text", { name: "comment" })
  comment: string;

  @Column("timestamp with time zone", {
    name: "created_at",
    nullable: true,
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date | null;

  @Column("timestamp with time zone", {
    name: "edited_at",
    nullable: true,
    default: () => "CURRENT_TIMESTAMP",
  })
  editedAt: Date | null;

  @ManyToOne(() => Recipes, (recipes) => recipes.recipeComments)
  @JoinColumn([{ name: "recipe_id", referencedColumnName: "id" }])
  recipe: Recipes;

  @ManyToOne(() => Users, (users) => users.recipeComments)
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: Users;
}
