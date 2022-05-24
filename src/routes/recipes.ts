import { getRepository } from "typeorm";
import { Application, Request, Response } from "express";
import { Recipes } from "../entities/Recipes";
import { Users } from "../entities/Users";
import { slugGenerator } from "../helpers/recipe/slugGenerator";
import upsertTags from "../helpers/tags/upsertTag";
import createRecipeTags from "../helpers/recipe/createRecipeTags";
import { generateRandomString } from "../helpers/generateRandomString";
import createRecipeSteps from "../helpers/recipe/createRecipeSteps";
import { RecipeHasIngredients } from "../entities/RecipeHasIngredients";
import { UserLikesRecipe } from "../entities/UserLikesRecipe";
import { Tags } from "../entities/Tags";
import createRecipeIngredients from "../helpers/recipe/createRecipeIngredients";
import { Metrics } from "../entities/Metrics";
import { Ingredients } from "../entities/Ingredients";
import generateGravatarUrl from "../helpers/generateGravatarUrl";
import { RecipeSteps } from "../entities/RecipeSteps";
import { RecipeHasTags } from "../entities/RecipeHasTags";
import { RecipeComments } from "../entities/RecipeComments";

export default (server: Application) => {
  server.post("/recipe", async (req: Request, res: Response) => {
    const user = await getRepository(Users).findOne({
      id: req?.body?.userId,
    });

    if (!user) {
      return res.status(200).send({ msg: "Couldn't find user with that id" });
    }
    const slug = req?.body?.slug || `${slugGenerator(req?.body?.title?.trim())}-${generateRandomString()}`;
    const recipe = new Recipes();
    recipe.userId = user.id;
    recipe.title = req?.body?.title?.trim();
    recipe.slug = slug?.length > 100 ? slug.slice(0, 100) : slug;
    recipe.description = req?.body?.description;
    recipe.coverImage = req?.body?.coverImage;
    recipe.public = req?.body?.public ?? true;
    recipe.estimatedTime = req?.body?.estimatedTime || null;
    recipe.createdAt = req?.body?.createdAt || new Date();
    recipe.editedAt = new Date();

    const savedRecipe = await getRepository(Recipes)
      .save({
        ...recipe,
      })
      .catch((error) => console.error("Error saving recipe", error));

    if (!savedRecipe) {
      return res.status(400).send({
        msg: "Error saving recipe",
        recipe: savedRecipe,
      });
    }

    if (req?.body?.steps?.length) {
      await createRecipeSteps(savedRecipe, req?.body?.steps);
    }

    // create any missing tags
    const recipeTags = req?.body?.tags?.length ? await upsertTags(req?.body?.tags) : [];

    // create the join tables
    if (recipeTags?.length) {
      await createRecipeTags(savedRecipe, recipeTags);
    }

    if (req?.body?.ingredients?.length) {
      const validIngredients = req?.body?.ingredients?.filter(
        (i: {
          metricId: Metrics["id"];
          amount: RecipeHasIngredients["amount"];
          ingredient: Ingredients["ingredient"];
        }) => i?.metricId && i?.amount && i?.ingredient?.trim()?.length,
      );

      if (validIngredients?.length) {
        await createRecipeIngredients(savedRecipe, validIngredients);
      }
    }

    return res.status(200).send({
      msg: "No errors",
      recipe: {
        ...savedRecipe,
        slug: savedRecipe?.slug || recipe.slug,
      },
    });
  });

  server.put("/recipe", async (req: Request, res: Response) => {
    const recipe = await getRepository(Recipes).findOne({ id: req?.body?.id });

    if (recipe.title !== req?.body?.title?.trim()) {
      recipe.title = req?.body?.title?.trim();

      const slug = req?.body?.slug || `${slugGenerator(req?.body?.title?.trim())}-${generateRandomString()}`;

      recipe.slug = slug?.length > 100 ? slug.slice(0, 100) : slug;
    }

    recipe.description = req?.body?.description;
    recipe.coverImage = req?.body?.coverImage;
    recipe.public = req?.body?.public ?? true;
    recipe.estimatedTime = req?.body?.estimatedTime || null;
    recipe.editedAt = new Date();

    const savedRecipe = await getRepository(Recipes)
      .save({
        ...recipe,
      })
      .catch((error) => {
        console.error("Error updating recipe", error);
        res.status(500).send({ msg: "Error updating recipe" });
        return null;
      });

    if (savedRecipe) {
      if (req?.body?.steps?.length) {
        await createRecipeSteps(savedRecipe, req?.body?.steps);
      }

      // create any missing tags
      const recipeTags = req?.body?.tags?.length ? await upsertTags(req?.body?.tags) : [];

      // create the join tables
      if (recipeTags?.length) {
        await createRecipeTags(savedRecipe, recipeTags);
      }

      if (req?.body?.ingredients?.length) {
        const validIngredients = req?.body?.ingredients?.filter(
          (i: {
            metricId: Metrics["id"];
            amount: RecipeHasIngredients["amount"];
            ingredient: Ingredients["ingredient"];
          }) => i?.metricId && i?.amount && i?.ingredient?.trim()?.length,
        );

        if (validIngredients?.length) {
          await createRecipeIngredients(savedRecipe, validIngredients);
        }
      }

      res.status(200).send({
        msg: "No errors",
        recipe: {
          ...savedRecipe,
          slug: savedRecipe?.slug || recipe.slug,
        },
      });
    } else {
      res.status(500).send({ msg: "An unknown error happened" });
    }
  });

  server.get("/recipe/:username/:slug", async (req: Request, res: Response) => {
    const user = await getRepository(Users).findOne({
      username: req.params.username.toLowerCase(),
    });

    if (!user) {
      return res.status(404).send({
        msg: "User not found",
      });
    }

    const recipe = await getRepository(Recipes)
      .createQueryBuilder("recipe")
      .where("recipe.userId = :userId", {
        userId: user.id,
      })
      .andWhere("recipe.slug = :slug", {
        slug: req.params.slug,
      })
      .leftJoinAndSelect("recipe.recipeSteps", "recipeSteps")
      .leftJoinAndSelect("recipe.recipeHasIngredients", "recipeHasIngredients")
      .leftJoinAndSelect("recipeHasIngredients.ingredient", "ingredients")
      .leftJoinAndSelect("recipeHasIngredients.metric", "metric")
      .leftJoinAndSelect("recipe.recipeComments", "recipeComments")
      .leftJoinAndSelect("recipe.recipeHasTags", "recipeHasTags")
      .leftJoinAndSelect("recipeHasTags.tag", "recipeTags")
      .getOne();

    if (recipe) {
      return res.status(200).send({
        ...recipe,
        recipeHasTags: undefined,
        recipeHasIngredients: undefined,
        tags: recipe?.recipeHasTags?.map((recipeTag) => recipeTag?.tag),
        ingredients: recipe?.recipeHasIngredients?.map((recipeIngredient) => ({
          ...recipeIngredient,
          ingredient: recipeIngredient?.ingredient?.ingredient,
          metric: recipeIngredient?.metric?.metric,
        })),
      });
    }

    return res.status(404).send({
      msg: "Recipe not found",
    });
  });

  server.get("/recipes/recent", async (req: Request, res: Response) => {
    const skip =
      req?.query?.skip && !Number.isNaN(req?.query?.skip?.toString()) ? parseInt(req?.query?.skip?.toString(), 10) : 0;

    const take =
      req?.query?.take && !Number.isNaN(parseInt(req?.query?.take?.toString(), 10))
        ? parseInt(req?.query?.take?.toString(), 10)
        : 20;

    const recipes = await getRepository(Recipes)
      .createQueryBuilder("recipe")
      .orderBy("recipe.createdAt", "DESC")
      .skip(skip)
      .take(take)
      .leftJoinAndSelect("recipe.user", "user")
      .leftJoinAndSelect("recipe.recipeHasTags", "recipeHasTags")
      .leftJoinAndSelect("recipeHasTags.tag", "recipeTags")
      .getMany();

    res.status(200).send({
      recipes: recipes?.map((r) => ({
        ...r,
        author: r?.user?.username,
        avatarUrl: r?.user?.avatarUrl ?? generateGravatarUrl(r?.user?.email),
        user: undefined,
        recipeHasTags: undefined,
        tags: r?.recipeHasTags?.map((rt) => rt?.tag),
      })),
    });
  });

  server.get("/recipes/trending", async (req: Request, res: Response) => {
    const skip =
      req?.query?.skip && !Number.isNaN(req?.query?.skip?.toString()) ? parseInt(req?.query?.skip?.toString(), 10) : 0;

    const take =
      req?.query?.take && !Number.isNaN(parseInt(req?.query?.take?.toString(), 10))
        ? parseInt(req?.query?.take?.toString(), 10)
        : 10;

    const mostLikedMonth = await getRepository(UserLikesRecipe)
      .query(
        `SELECT recipe_id
         FROM user_likes_recipe
         WHERE created_at > (CURRENT_DATE - INTERVAL '30 days')
         GROUP BY recipe_id
         ORDER BY COUNT(recipe_id) DESC`,
      )
      ?.then((ids: { recipe_id: number }[]) => ids?.map((id) => id?.recipe_id)?.splice(skip, take));

    if (mostLikedMonth.length) {
      const recipes = await getRepository(Recipes)
        .createQueryBuilder("recipe")
        .where("recipe.id IN (:...recipeIds)", { recipeIds: mostLikedMonth })
        .leftJoinAndSelect("recipe.user", "user")
        .leftJoinAndSelect("recipe.recipeHasTags", "recipeHasTags")
        .leftJoinAndSelect("recipeHasTags.tag", "recipeTags")
        .getMany();

      res.status(200).send({
        recipes: recipes?.map((r) => ({
          ...r,
          author: r?.user?.username,
          avatarUrl: r?.user?.avatarUrl ?? generateGravatarUrl(r?.user?.email),
          user: undefined,
          recipeHasTags: undefined,
          tags: r?.recipeHasTags?.map((rt) => rt?.tag),
        })),
      });
    } else {
      res.status(200).send({ msg: "No trending recipes", recipes: [] });
    }
  });

  server.get("/recipes/:tag/recent", async (req: Request, res: Response) => {
    const skip =
      req?.query?.skip && !Number.isNaN(req?.query?.skip?.toString()) ? parseInt(req?.query?.skip?.toString(), 10) : 0;

    const take =
      req?.query?.take && !Number.isNaN(parseInt(req?.query?.take?.toString(), 10))
        ? parseInt(req?.query?.take?.toString(), 10)
        : 20;

    const tag = await getRepository(Tags).findOne({ tag: req.params.tag.toLowerCase() });

    if (!tag) {
      res.status(404).send({ msg: "Tag not found" });
      return;
    }

    const recipes = await getRepository(Recipes)
      .createQueryBuilder("recipe")
      .orderBy("recipe.createdAt", "DESC")
      .skip(skip)
      .take(take)
      .leftJoinAndSelect("recipe.user", "user")
      .leftJoinAndSelect("recipe.recipeHasTags", "recipeHasTags")
      .leftJoinAndSelect("recipeHasTags.tag", "recipeTags")
      .where("recipeHasTags.tagId = :tagId", { tagId: tag.id })
      .getMany();

    res.status(200).send({
      recipes:
        recipes?.map((r) => ({
          ...r,
          author: r?.user?.username,
          avatarUrl: r?.user?.avatarUrl,
          user: undefined,
          recipeHasTags: undefined,
          tags: r?.recipeHasTags?.map((rt) => rt?.tag),
        })) || [],
    });
  });

  server.get("/recipes/:tag/trending", async (req: Request, res: Response) => {
    const skip =
      req?.query?.skip && !Number.isNaN(req?.query?.skip?.toString()) ? parseInt(req?.query?.skip?.toString(), 10) : 0;

    const take =
      req?.query?.take && !Number.isNaN(parseInt(req?.query?.take?.toString(), 10))
        ? parseInt(req?.query?.take?.toString(), 10)
        : 10;

    const tag = await getRepository(Tags).findOne({ tag: req.params.tag.toLowerCase() });

    if (!tag) {
      res.status(404).send({ msg: "Tag not found" });
      return;
    }

    const mostLikedMonth = await getRepository(UserLikesRecipe)
      .query(
        `SELECT user_likes_recipe.recipe_id
         FROM user_likes_recipe
         LEFT JOIN recipe_has_tags
         ON recipe_has_tags.recipe_id = user_likes_recipe.recipe_id
         WHERE user_likes_recipe.created_at > (CURRENT_DATE - INTERVAL '30 days') 
          AND recipe_has_tags.tag_id = $1
         GROUP BY user_likes_recipe.recipe_id
         ORDER BY COUNT(user_likes_recipe.recipe_id) DESC`,
        [tag.id],
      )
      ?.then((ids: { recipe_id: number }[]) => ids?.map((id) => id?.recipe_id)?.splice(skip, take));

    if (mostLikedMonth.length) {
      const recipes = await getRepository(Recipes)
        .createQueryBuilder("recipe")
        .where("recipe.id IN (:...recipeIds)", { recipeIds: mostLikedMonth })
        .leftJoinAndSelect("recipe.user", "user")
        .leftJoinAndSelect("recipe.recipeHasTags", "recipeHasTags")
        .leftJoinAndSelect("recipeHasTags.tag", "recipeTags")
        .getMany();

      res.status(200).send({
        recipes: recipes?.map((r) => ({
          ...r,
          author: r?.user?.username,
          avatarUrl: r?.user?.avatarUrl,
          user: undefined,
          recipeHasTags: undefined,
          tags: r?.recipeHasTags?.map((rt) => rt?.tag),
        })),
      });
    } else {
      res.status(200).send({ msg: "No trending recipes", recipes: [] });
    }
  });

  server.get("/recipes/:recipeId", async (req: Request, res: Response) => {
    const recipe = await getRepository(Recipes)
      .createQueryBuilder("recipe")
      .where("recipe.id = :recipeId", {
        recipeId: parseInt(req.params.recipeId, 10),
      })
      .leftJoinAndSelect("recipe.recipeSteps", "recipeSteps")
      .leftJoinAndSelect("recipe.recipeHasIngredients", "recipeHasIngredients")
      .leftJoinAndSelect("recipeHasIngredients.ingredient", "ingredients")
      .leftJoinAndSelect("recipeHasIngredients.metric", "metric")
      .leftJoinAndSelect("recipe.recipeComments", "recipeComments")
      .leftJoinAndSelect("recipe.recipeHasTags", "recipeHasTags")
      .leftJoinAndSelect("recipeHasTags.tag", "recipeTags")
      .getOne();

    if (recipe) {
      res.status(200).send({
        ...recipe,
        recipeHasTags: undefined,
        recipeHasIngredients: undefined,
        tags: recipe?.recipeHasTags?.map((recipeTag) => recipeTag?.tag?.tag) ?? [],
        ingredients:
          recipe?.recipeHasIngredients?.map((recipeIngredient) => ({
            ...recipeIngredient,
            ingredient: recipeIngredient?.ingredient?.ingredient,
            metric: recipeIngredient?.metric?.metric,
          })) ?? [],
        steps: recipe?.recipeSteps ?? [],
      });
    } else {
      res.status(404).send({
        msg: "Recipe not found",
      });
    }
  });

  server.delete("/recipes/:recipeId", async (req: Request, res: Response) => {
    await getRepository(RecipeSteps)
      .createQueryBuilder()
      .delete()
      .where("recipe_id = :recipeId")
      .setParameters({ recipeId: parseInt(req?.params?.recipeId, 10) })
      .execute()
      .catch((error) => console.error("Error deleting RecipeSteps", error));

    await getRepository(RecipeHasTags)
      .createQueryBuilder()
      .delete()
      .where("recipe_id = :recipeId")
      .setParameters({ recipeId: parseInt(req?.params?.recipeId, 10) })
      .execute()
      .catch((error) => console.error("Error deleting RecipeHasTags", error));

    await getRepository(UserLikesRecipe)
      .createQueryBuilder()
      .delete()
      .where("recipe_id = :recipeId")
      .setParameters({ recipeId: parseInt(req?.params?.recipeId, 10) })
      .execute()
      .catch((error) => console.error("Error deleting RecipeHasTags", error));

    await getRepository(RecipeComments)
      .createQueryBuilder()
      .delete()
      .where("recipe_id = :recipeId")
      .setParameters({ recipeId: parseInt(req?.params?.recipeId, 10) })
      .execute()
      .catch((error) => console.error("Error deleting RecipeHasTags", error));

    await getRepository(RecipeHasIngredients)
      .createQueryBuilder()
      .delete()
      .where("recipe_id = :recipeId")
      .setParameters({ recipeId: parseInt(req?.params?.recipeId, 10) })
      .execute()
      .catch((error) => console.error("Error deleting RecipeHasIngredients", error));

    const result = await getRepository(Recipes)
      .createQueryBuilder()
      .delete()
      .where("id = :recipeId")
      .setParameters({ recipeId: parseInt(req?.params?.recipeId, 10) })
      .execute()
      .catch((error) => {
        console.error("Error deleting tags", error);
        return error;
      });

    res.status(200).send({ result });
  });

  // NOTE: might need to be change to check by id in the future for better performance
  // but shouldn't really matter in the beginning because of the low data size
  server.get("/recipes/user/:username", async (req: Request, res: Response) => {
    const recipes: Recipes[] = await getRepository(Recipes).query(
      `SELECT title,
          slug,
          cover_image as "coverImage",
          $1 as author
      FROM recipes
      WHERE user_id = (
              SELECT id
              FROM users
              WHERE username = $1
          )
      ORDER BY id DESC;`,
      [req?.params?.username],
    );

    res.status(200).send({ recipes });
  });

  server.get("/recipe/like/:recipeId/:userId", async (req: Request, res: Response) => {
    const recipeId = parseInt(req.params.recipeId, 10);
    const userId = parseInt(req.params.userId, 10);

    if (Number.isNaN(userId) || Number.isNaN(recipeId)) {
      return res.status(400).send({ msg: "Not a valid userId or recipeId" });
    }

    const liked = await getRepository(UserLikesRecipe).count({
      recipeId,
      userId,
    });

    return res.status(200).send({
      userLiked: !!liked,
    });
  });

  server.post("/recipe/like/:recipeId/:userId", async (req: Request, res: Response) => {
    const recipeId = parseInt(req.params.recipeId, 10);
    const userId = parseInt(req.params.userId, 10);

    if (Number.isNaN(userId) || Number.isNaN(recipeId)) {
      return res.status(400).send({ msg: "Not a valid userId or recipeId" });
    }

    const deleteResult = await getRepository(UserLikesRecipe).delete({ recipeId, userId });

    if (deleteResult?.affected) {
      return res.status(200).send({
        msg: "Deleted existing",
        deleteResult,
      });
    }

    const recipe = await getRepository(Recipes).findOne({
      id: recipeId,
    });

    if (recipe.userId === userId) {
      return res.status(400).send({ msg: "Cannot like own recipe" });
    }

    const newLike = new UserLikesRecipe();

    newLike.recipeId = recipeId;
    newLike.userId = userId;

    const result = await getRepository(UserLikesRecipe).save({
      ...newLike,
    });

    return res.status(200).send({
      msg: "Created new like",
      result,
    });
  });
};
