import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { RecipeComments } from "./RecipeComments";
import { RecipeHasIngredients } from "./RecipeHasIngredients";
import { RecipeHasTags } from "./RecipeHasTags";
import { RecipeSteps } from "./RecipeSteps";
import { Languages } from "./Languages";
import { Users } from "./Users";
import { UserLikesRecipe } from "./UserLikesRecipe";

@Index("recipes_pkey", ["id"], { unique: true })
@Entity("recipes", { schema: "public" })
export class Recipes {
  @PrimaryGeneratedColumn({ type: "integer", name: "id" })
  id: number;

  @Column("integer", { name: "user_id" })
  userId: number;

  @Column("character varying", { name: "title", length: 100 })
  title: string;

  @Column("character varying", { name: "slug", length: 100 })
  slug: string;

  @Column("text", { name: "description", nullable: true })
  description: string | null;

  @Column("character varying", {
    name: "cover_image",
    nullable: true,
    length: 255,
  })
  coverImage: string | null;

  @Column("boolean", { name: "public", nullable: true, default: () => "true" })
  public: boolean | null;

  /** minutes */
  @Column("integer", { name: "estimated_time", nullable: true })
  estimatedTime: number | null;

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

  @OneToMany(() => RecipeComments, (recipeComments) => recipeComments.recipe)
  recipeComments: RecipeComments[];

  @OneToMany(() => RecipeHasIngredients, (recipeHasIngredients) => recipeHasIngredients.recipe)
  recipeHasIngredients: RecipeHasIngredients[];

  @OneToMany(() => RecipeHasTags, (recipeHasTags) => recipeHasTags.recipe)
  recipeHasTags: RecipeHasTags[];

  @OneToMany(() => RecipeSteps, (recipeSteps) => recipeSteps.recipe)
  recipeSteps: RecipeSteps[];

  @ManyToOne(() => Languages, (languages) => languages.recipes)
  @JoinColumn([{ name: "language_id", referencedColumnName: "id" }])
  language: Languages;

  @ManyToOne(() => Users, (users) => users.recipes)
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: Users;

  @OneToMany(() => UserLikesRecipe, (userLikesRecipe) => userLikesRecipe.recipe)
  userLikesRecipes: UserLikesRecipe[];
}
