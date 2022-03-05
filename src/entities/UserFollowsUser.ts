import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Users } from "./Users";

@Index("user_follows_user_user_id_follower_id_key", ["followerId", "userId"], {
  unique: true,
})
@Entity("user_follows_user", { schema: "public" })
export class UserFollowsUser {
  @PrimaryColumn("integer", { name: "user_id", unique: true })
  userId: number;

  @PrimaryColumn("integer", { name: "follower_id", unique: true })
  followerId: number;

  @Column("timestamp with time zone", {
    name: "created_at",
    nullable: true,
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date | null;

  @ManyToOne(() => Users, (users) => users.userFollowsUsers)
  @JoinColumn([{ name: "follower_id", referencedColumnName: "id" }])
  follower: Users;

  @ManyToOne(() => Users, (users) => users.userFollowsUsers2)
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: Users;
}
