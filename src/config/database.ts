import dotenv from "dotenv";
import { ConnectionOptions } from "typeorm";
import { Ingredients } from "../entities/Ingredients";
import { Languages } from "../entities/Languages";
import { Metrics } from "../entities/Metrics";
import { RecipeComments } from "../entities/RecipeComments";
import { RecipeHasIngredients } from "../entities/RecipeHasIngredients";
import { RecipeHasTags } from "../entities/RecipeHasTags";
import { Recipes } from "../entities/Recipes";
import { RecipeSteps } from "../entities/RecipeSteps";
import { Tags } from "../entities/Tags";
import { UserFollowsTag } from "../entities/UserFollowsTag";
import { UserFollowsUser } from "../entities/UserFollowsUser";
import { UserLikesRecipe } from "../entities/UserLikesRecipe";
import { UserRoles } from "../entities/UserRoles";
import { Users } from "../entities/Users";

if (process.env.NODE_ENV !== "production") dotenv.config();

export const dbConfig: ConnectionOptions = {
  type: "postgres",
  host: process.env.POSTGRES_HOST || "localhost",
  port: Number(process.env.POSTGRES_PORT) || 5432,
  username: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "example",
  database: process.env.POSTGRES_DB || "bearnaisee",
  synchronize: true,
  entities: [
    Ingredients,
    Languages,
    Metrics,
    RecipeComments,
    RecipeHasIngredients,
    RecipeHasTags,
    Recipes,
    RecipeSteps,
    Tags,
    UserFollowsTag,
    UserFollowsUser,
    UserLikesRecipe,
    UserRoles,
    Users,
  ],
};
