import { ObjectType, Field, ID } from 'type-graphql';

@ObjectType()
export class Identity {
  @Field(type => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  dob: Date;

  @Field({ nullable: true })
  description: string;

  @Field()
  createdAt: Date;
}
