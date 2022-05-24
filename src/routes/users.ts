import { getManager, getRepository } from "typeorm";
import { Application, Request, Response } from "express";
import { hashString, verifyHash } from "../helpers/hashing";
import { Users } from "../entities/Users";
import { UserRoles } from "../entities/UserRoles";
import { UserFollowsUser } from "../entities/UserFollowsUser";
import { Recipes } from "../entities/Recipes";
import generateGravatarUrl from "../helpers/generateGravatarUrl";

export default (server: Application) => {
  server.post("/users", async (req: Request, res: Response) => {
    if (!req?.body?.username?.trim()?.length || !req?.body?.email?.trim()?.length || !req?.body?.password?.length) {
      res.status(400).send({ msg: "Missing data", successful: false });
      return;
    }

    const hashedPassword = await hashString(req.body.password);
    const passwordVerification = await verifyHash(hashedPassword, req.body.password);

    if (!hashedPassword || !passwordVerification) {
      res.status(500).send({ msg: "Something went wrong hashing password", successful: false });
      return;
    }

    const userRepository = getRepository(Users);

    const existingUsers = await userRepository
      .createQueryBuilder("user")
      .where("user.email = :email OR user.username = :username")
      .setParameters({
        email: req.body.email.toLowerCase().trim(),
        username: req.body.username.toLowerCase().trim(),
      })
      .getMany();

    if (existingUsers?.length) {
      res.status(409).send({
        msg: "Username or email already in use",
        successful: false,
        usernameTaken: existingUsers.findIndex((u) => u.username === req.body.username.toLowerCase().trim()) !== -1,
        emailTaken: existingUsers.findIndex((u) => u.email === req.body.email.toLowerCase().trim()) !== -1,
      });
      return;
    }

    const user = new Users();
    user.username = req.body.username.toLowerCase().trim();
    user.email = req.body.email.toLowerCase().trim();
    user.password = hashedPassword;
    user.role = await getRepository(UserRoles).findOne({ id: 1 });
    user.avatarUrl = generateGravatarUrl(user.email);

    await userRepository
      .save({
        ...user,
      })
      .then((result) =>
        res.status(200).send({
          msg: "Created new user succesfully",
          successful: true,
          user: {
            ...result,
            password: undefined,
            bannedAt: undefined,
          },
        }),
      )
      .catch((error) => {
        console.error("Something went wrong creating user", error);
        res.status(500).send({
          msg: "Something went wrong creating user",
          successful: false,
          error,
        });
      });
  });

  server.post("/user/login", async (req: Request, res: Response) => {
    if (!req?.body?.email?.trim()?.length || !req?.body?.password?.length) {
      return res.status(400).send({ msg: "Missing data", successful: false });
    }

    const userRepository = getRepository(Users);

    const user = await userRepository.findOne({
      email: req.body.email.toLowerCase().trim(),
    });

    if (user) {
      const correctPassword = await verifyHash(user.password, req.body.password);

      if (correctPassword) {
        return res.status(200).send({
          msg: "Logged in successful",
          user: {
            ...user,
            password: undefined,
            bannedAt: undefined,
          },
          successful: true,
        });
      }

      return res.status(400).send({ msg: "Wrong password", successful: false });
    }

    return res.status(404).send({ msg: "User not found", successful: false });
  });

  server.get("/user/:username", async (req: Request, res: Response) => {
    const user = await getRepository(Users)
      .findOne({
        username: req?.params?.username?.trim()?.toLowerCase(),
      })
      .catch((error) => console.error("Error finding user", req.params.username, error));

    if (user) {
      return res.status(200).send({
        ...user,
        password: undefined,
        bannedAt: undefined,
      });
    }

    return res.status(404).send({ user: null });
  });

  server.get("/user/stats/:userId", async (req: Request, res: Response) => {
    const userId = parseInt(req?.params?.userId, 10);

    if (Number.isNaN(userId)) {
      return res.status(400).send({ msg: "Not a valid userId" });
    }
    // TODO: the 2 queries into a single raw
    const followerCount = await getRepository(UserFollowsUser).count({
      userId,
    });

    const followingCount = await getRepository(UserFollowsUser).count({
      followerId: userId,
    });

    return res.status(200).send({
      followerCount: followerCount || 0,
      followingCount: followingCount || 0,
    });
  });

  server.get("/user/follow/:userId/:followerId", async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId, 10);
    const followerId = parseInt(req.params.followerId, 10);

    if (Number.isNaN(userId) || Number.isNaN(followerId)) {
      return res.status(400).send({ msg: "Not a valid userId or followerId" });
    }

    const following = await getRepository(UserFollowsUser).count({
      userId,
      followerId,
    });

    return res.status(200).send({
      following: !!following,
    });
  });

  server.post("/user/follow/:userId/:followerId", async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId, 10);
    const followerId = parseInt(req.params.followerId, 10);

    if (Number.isNaN(userId) || Number.isNaN(followerId)) {
      return res.status(400).send({ msg: "Not a valid userId or followerId" });
    }
    const deleteResult = await getRepository(UserFollowsUser).delete({ userId, followerId });

    if (deleteResult?.affected) {
      return res.status(200).send({
        msg: "Deleted existing follow",
        deleteResult,
      });
    }

    const newFollow = new UserFollowsUser();

    newFollow.userId = userId;
    newFollow.followerId = followerId;

    const result = await getRepository(UserFollowsUser).save({
      ...newFollow,
    });

    return res.status(200).send({
      msg: "Created new follow",
      result,
    });
  });

  server.get("/feed/:userId", async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId, 10);

    if (Number.isNaN(userId)) {
      return res.status(400).send({ msg: "Not a valid userId", feed: [] });
    }

    const skip =
      req?.query?.skip && !Number.isNaN(req?.query?.skip?.toString()) ? parseInt(req?.query?.skip?.toString(), 10) : 0;

    const take =
      req?.query?.take && !Number.isNaN(parseInt(req?.query?.take?.toString(), 10))
        ? parseInt(req?.query?.take?.toString(), 10)
        : 10;

    const recipes: {
      id: number;
      slug: string;
      coverImage: string;
      title: string;
      userId: number;
      username: string;
      displayName: string;
      createdAt: string | Date;
      avatarUrl?: string;
    }[] = await getManager().query(
      `SELECT 
        r.id, 
        r.slug, 
        r.cover_image AS "coverImage", 
        r.title, 
        r.user_id AS "userId", 
        u.username as "author", 
        u.display_name as "displayName", 
        r.created_at AS "createdAt",
        u.avatar_url AS "avatarUrl"
      FROM 
        recipes r 
        INNER JOIN users u ON u.id = r.user_id 
      WHERE 
        r.user_id IN (
          SELECT 
            user_id 
          FROM 
            user_follows_user 
          WHERE 
            follower_id = $1
        ) 
      OFFSET $2 
      LIMIT $3;`,
      [userId, skip, take],
    );

    return res.status(200).send({
      feed: recipes,
      skip: skip + recipes.length,
    });
  });

  server.get("/user/who-to-follow/:userId", async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId, 10);

    if (Number.isNaN(userId)) {
      res.status(400).send({ msg: "Not a valid userId", users: [] });
      return;
    }

    const usersWithMostRecipes: { user_id: number }[] = await getRepository(Recipes).query(
      `
        SELECT user_id
        FROM recipes
        WHERE user_id != $1 AND user_id NOT IN (SELECT user_id FROM user_follows_user WHERE follower_id = $1)
        GROUP BY user_id
        ORDER BY COUNT(user_id) DESC
        LIMIT 4
      `,
      [userId],
    );

    if (!usersWithMostRecipes?.length) {
      res.status(200).send({ msg: "User is already following everybody" });
      return;
    }

    const users = await getRepository(Users)
      .createQueryBuilder("user")
      .select("user.id")
      .addSelect("user.username")
      .addSelect("user.displayName")
      .addSelect("user.email")
      .addSelect("user.avatarUrl")
      .where("user.id in (:...userIds)", {
        userIds: usersWithMostRecipes?.map((u) => u?.user_id),
      })
      .getMany();

    for (let i = 0; i < users.length; i += 1) {
      if (!users[i].avatarUrl) {
        users[i].avatarUrl = generateGravatarUrl(users[i].email);

        users[i].email = undefined;
      }
    }

    res.status(200).send({
      users,
    });
  });

  server.get("/user/liked/recipes/:userId", async (req: Request, res: Response) => {
    const skip =
      req?.query?.skip && !Number.isNaN(req?.query?.skip?.toString()) ? parseInt(req?.query?.skip?.toString(), 10) : 0;

    const recipes: {
      title: string;
      slug: string;
      username: string;
      coverImage: string;
      email: string;
      avatarUrl?: string;
    }[] = await getManager().query(
      `SELECT 
          r.title, 
          r.slug, 
          r.cover_image AS "coverImage", 
          u.username AS author,
          u.username as email
        FROM 
          recipes r 
          INNER JOIN user_likes_recipe ulr ON ulr.recipe_id = r.id 
          INNER JOIN users u ON u.id = r.user_id 
        WHERE ulr.user_id = $1
        ORDER BY r.id DESC 
        OFFSET $2
        LIMIT 20`,
      [parseInt(req.params.userId, 10), skip],
    );

    for (let i = 0; i < recipes?.length; i += 1) {
      if (!recipes[i].avatarUrl) {
        recipes[i].avatarUrl = generateGravatarUrl(recipes[i].email);
        recipes[i].email = undefined;
      }
    }

    res.status(200).send({
      recipes,
    });
  });

  server.post("/user/settings", async (req: Request, res: Response) => {
    if (!req?.body?.userId) {
      res.status(400).send({ msg: "Missing userId" });
      return;
    }

    const user = await getRepository(Users).findOne({ id: req.body.userId });

    if (!user?.id) {
      res.status(404).send({ msg: "User not found" });
      return;
    }

    const displayName = req?.body?.displayName?.trim() || user?.username;
    const description = req?.body?.description?.trim();
    const location = req?.body?.location?.trim();
    const website = req?.body?.website?.trim();

    user.displayName = displayName?.slice(0, displayName?.length > 50 ? 50 : displayName?.length);
    user.description = description?.slice(0, description?.length > 255 ? 255 : description?.length);
    user.location = location?.slice(0, location?.length > 40 ? 40 : location?.length);
    user.website = website?.slice(0, website?.length > 40 ? 40 : website?.length);
    user.avatarUrl = generateGravatarUrl(user.email);

    await getRepository(Users)
      .save({
        ...user,
      })
      .then(() => res.status(200).send({ msg: "Updated settings" }))
      .catch((error) => {
        console.error("Error updating settings", error);
        res.status(500).send({ msg: "Error updating settings" });
      });
  });
};
