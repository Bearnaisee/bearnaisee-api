import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Tags } from "./Tags";
import { Users } from "./Users";

@Index("user_follows_tag_user_id_tag_id_key", ["tagId", "userId"], {
  unique: true,
})
@Entity("user_follows_tag", { schema: "public" })
export class UserFollowsTag {
  @Column("integer", { name: "user_id", unique: true })
  userId: number;

  @Column("integer", { name: "tag_id", unique: true })
  tagId: number;

  @ManyToOne(() => Tags, (tags) => tags.userFollowsTags)
  @JoinColumn([{ name: "tag_id", referencedColumnName: "id" }])
  tag: Tags;

  @ManyToOne(() => Users, (users) => users.userFollowsTags)
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: Users;
}
