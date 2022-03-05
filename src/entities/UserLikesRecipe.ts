import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Recipes } from "./Recipes";
import { Users } from "./Users";

@Index("user_likes_recipe_recipe_id_user_id_key", ["recipeId", "userId"], {
  unique: true,
})
@Entity("user_likes_recipe", { schema: "public" })
export class UserLikesRecipe {
  @PrimaryColumn("integer", { name: "recipe_id", unique: true })
  recipeId: number;

  @PrimaryColumn("integer", { name: "user_id", unique: true })
  userId: number;

  @Column("timestamp with time zone", {
    name: "created_at",
    nullable: true,
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date | null;

  @ManyToOne(() => Recipes, (recipes) => recipes.userLikesRecipes)
  @JoinColumn([{ name: "recipe_id", referencedColumnName: "id" }])
  recipe: Recipes;

  @ManyToOne(() => Users, (users) => users.userLikesRecipes)
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: Users;
}
