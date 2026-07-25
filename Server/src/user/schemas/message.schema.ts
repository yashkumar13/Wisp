import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 5000 })
  content: string;

  @Prop({ type: String, enum: MessageStatus, default: MessageStatus.SENT })
  status: MessageStatus;

  @Prop({ default: false })
  isEdited: boolean;

  @Prop({ default: null })
  editedAt: Date;

  // Soft delete — never hard-remove the doc. If you did, the other
  // participant's already-loaded chat view would have a "hole" that
  // breaks pagination ordering mid-scroll. Render this as a
  // "message deleted" placeholder client-side instead.
  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: null })
  deletedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// This is the index that matters most for the whole app — nearly every
// read is "give me messages in this conversation, most recent first,
// paginated by cursor." Compound index on exactly those two fields.
MessageSchema.index({ conversationId: 1, createdAt: -1 });