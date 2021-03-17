import { Field, InputType } from 'type-graphql';
import { IsDate, Length } from 'class-validator';

@InputType()
export class IdentityCreateInput {
  @Field()
  @Length(1, 64)
  name: string;

  @Field(type => Date)
  @IsDate()
  dob: Date;

  @Field({ nullable: true })
  @Length(1, 1024)
  description: string;
}
