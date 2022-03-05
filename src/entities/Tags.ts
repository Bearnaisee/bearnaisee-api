import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { RecipeHasTags } from "./RecipeHasTags";
import { UserFollowsTag } from "./UserFollowsTag";

@Index("tags_pkey", ["id"], { unique: true })
@Index("tags_tag_key", ["tag"], { unique: true })
@Entity("tags", { schema: "public" })
export class Tags {
  @PrimaryGeneratedColumn({ type: "integer", name: "id" })
  id: number;

  @Column("character varying", { name: "tag", unique: true, length: 40 })
  tag: string;

  @OneToMany(() => RecipeHasTags, (recipeHasTags) => recipeHasTags.tag)
  recipeHasTags: RecipeHasTags[];

  @OneToMany(() => UserFollowsTag, (userFollowsTag) => userFollowsTag.tag)
  userFollowsTags: UserFollowsTag[];
}
