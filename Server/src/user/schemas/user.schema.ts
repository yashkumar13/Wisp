import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserAccountStatus {
  ACTIVE = 'active',
  DEACTIVATED = 'deactivated',
  DELETED = 'deleted',
}

export enum UserPresenceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  username: string;

  // lowercase + trim so "Yash@x.com" and "yash@x.com" are the same account
  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  email: string;

  // select: false so a normal find() never leaks the hash by accident —
  // you have to explicitly .select('+password') when checking login
  @Prop({ required: true })
  password: string;

  @Prop({ type: String, enum: UserPresenceStatus, default: UserPresenceStatus.OFFLINE })
  presenceStatus: UserPresenceStatus;

  @Prop({ default: null })
  lastSeenAt: Date;

  // soft account lifecycle — never hard-delete a user, see message.schema.ts
  // for why (their old messages need somewhere to point)
  @Prop({ type: String, enum: UserAccountStatus, default: UserAccountStatus.ACTIVE })
  accountStatus: UserAccountStatus;
}

export const UserSchema = SchemaFactory.createForClass(User);