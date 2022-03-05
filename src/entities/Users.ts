import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { RecipeComments } from "./RecipeComments";
import { Recipes } from "./Recipes";
import { UserFollowsTag } from "./UserFollowsTag";
import { UserFollowsUser } from "./UserFollowsUser";
import { UserLikesRecipe } from "./UserLikesRecipe";
import { UserRoles } from "./UserRoles";

@Index("users_email_key", ["email"], { unique: true })
@Index("users_pkey", ["id"], { unique: true })
@Index("users_username_key", ["username"], { unique: true })
@Entity("users", { schema: "public" })
export class Users {
  @PrimaryGeneratedColumn({ type: "integer", name: "id" })
  id: number;

  @Column("character varying", { name: "username", unique: true, length: 50 })
  username: string;

  @Column("character varying", {
    name: "display_name",
    nullable: true,
    length: 50,
  })
  displayName: string | null;

  @Column("character varying", { name: "email", unique: true, length: 255 })
  email: string;

  @Column("character varying", { name: "password", length: 255 })
  password: string;

  @Column("character varying", {
    name: "avatar_url",
    nullable: true,
    length: 255,
    default: () => "NULL::character varying",
  })
  avatarUrl: string | null;

  @Column("character varying", {
    name: "description",
    nullable: true,
    length: 255,
    default: () => "NULL::character varying",
  })
  description: string | null;

  @Column("character varying", {
    name: "location",
    nullable: true,
    length: 40,
    default: () => "NULL::character varying",
  })
  location: string | null;

  @Column("character varying", {
    name: "website",
    nullable: true,
    length: 40,
    default: () => "NULL::character varying",
  })
  website: string | null;

  @Column("timestamp with time zone", {
    name: "created_at",
    nullable: true,
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date | null;

  @Column("timestamp with time zone", { name: "banned_at", nullable: true })
  bannedAt: Date | null;

  @OneToMany(() => RecipeComments, (recipeComments) => recipeComments.user)
  recipeComments: RecipeComments[];

  @OneToMany(() => Recipes, (recipes) => recipes.user)
  recipes: Recipes[];

  @OneToMany(() => UserFollowsTag, (userFollowsTag) => userFollowsTag.user)
  userFollowsTags: UserFollowsTag[];

  @OneToMany(() => UserFollowsUser, (userFollowsUser) => userFollowsUser.follower)
  userFollowsUsers: UserFollowsUser[];

  @OneToMany(() => UserFollowsUser, (userFollowsUser) => userFollowsUser.user)
  userFollowsUsers2: UserFollowsUser[];

  @OneToMany(() => UserLikesRecipe, (userLikesRecipe) => userLikesRecipe.user)
  userLikesRecipes: UserLikesRecipe[];

  @ManyToOne(() => UserRoles, (userRoles) => userRoles.users)
  @JoinColumn([{ name: "role_id", referencedColumnName: "id" }])
  role: UserRoles;
}
