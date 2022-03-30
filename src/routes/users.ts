import { getManager, getRepository } from "typeorm";
import { Application, Request, Response } from "express";
import md5 from "md5";
import { hashString, verifyHash } from "../helpers/hashing";
import { Users } from "../entities/Users";
import { UserRoles } from "../entities/UserRoles";
import { UserFollowsUser } from "../entities/UserFollowsUser";
import { Recipes } from "../entities/Recipes";

export default (server: Application) => {
  server.post("/user/create", async (req: Request, res: Response) => {
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

    const followedUsers = await getRepository(UserFollowsUser)
      .createQueryBuilder()
      .select("UserFollowsUser.user_id")
      .where("UserFollowsUser.followerId = :followerId", {
        followerId: userId,
      })
      .execute()
      ?.then((users: { user_id: number }[]) => users?.map((u) => ({ userId: u?.user_id })));

    const recipes = await getRepository(Recipes).find({
      where: followedUsers,
      relations: ["user"],
      skip,
      take,
    });

    // TODO: figure out how to join and select
    for (let i = 0; i < recipes.length; i += 1) {
      recipes[i].user.email = undefined;
      recipes[i].user.password = undefined;
    }

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
        if (users[i].email) {
          const emailHash = md5(users[i].email.trim().toLowerCase());

          users[i].avatarUrl = `https://gravatar.com/avatar/${emailHash}?s=192`;
        } else {
          users[i].avatarUrl = "http://www.gravatar.com/avatar/?d=mp&s=192";
        }
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
    }[] = await getManager().query(
      `SELECT 
          r.title, 
          r.slug, 
          r.cover_image AS "coverImage", 
          u.username 
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

    res.status(200).send({
      recipes,
    });
  });
};
