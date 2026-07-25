import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  participantA: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  participantB: Types.ObjectId;

  // Sorted "<smallerUserId>_<largerUserId>" string, generated in the service
  // layer before insert. The unique index on this field is what actually
  // stops two people creating duplicate conversations if they both hit
  // "message" on each other at the same instant — app-level checks alone
  // can't guarantee that under a race condition, the DB constraint can.
  @Prop({ required: true, unique: true, index: true })
  pairKey: string;

  // Denormalized so the inbox/conversation-list screen never has to
  // join into the messages collection just to render a preview.
  @Prop({ default: '' })
  lastMessagePreview: string;

  @Prop({ default: undefined })
  lastMessageAt?: Date;

  // Per-participant unread counts. Keyed by role (A/B) rather than a map
  // keyed by userId, since this is strictly 1-on-1 for now — simpler to
  // read and update than a dynamic map.
  @Prop({ default: 0 })
  unreadCountA: number;

  @Prop({ default: 0 })
  unreadCountB: number;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);