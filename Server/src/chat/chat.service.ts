import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from 'src/user/schemas/conversation.schema';
import { Message, MessageDocument, MessageStatus } from 'src/user/schemas/message.schema';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
  ) {}

  async findUserConversations(userId: string) {
    const objectId = new Types.ObjectId(userId);
    const conversations = await this.conversationModel
      .find({ $or: [{ participantA: objectId }, { participantB: objectId }] })
      .sort({ lastMessageAt: -1 })
      .lean();

    return conversations.map((conversation) => {
      const isA = conversation.participantA.toString() === userId;
      const partnerId = isA
        ? conversation.participantB.toString()
        : conversation.participantA.toString();

      return {
        _id: conversation._id,
        conversationId: conversation._id.toString(),
        partnerId,
        lastMessagePreview: conversation.lastMessagePreview,
        lastMessageAt: conversation.lastMessageAt,
        unreadCount: isA ? conversation.unreadCountA : conversation.unreadCountB,
      };
    });
  }

  async findConversationMessages(conversationId: string) {
    return this.messageModel
      .find({ conversationId: new Types.ObjectId(conversationId), isDeleted: false })
      .sort({ createdAt: 1 })
      .lean();
  }

  private getPairKey(userA: string, userB: string) {
    return [userA, userB].sort().join('_');
  }

  private async getConversationPartner(conversationId: string, senderId: string) {
    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) {
      throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND);
    }

    const participantA = conversation.participantA.toString();
    const participantB = conversation.participantB.toString();

    if (senderId === participantA) return participantB;
    if (senderId === participantB) return participantA;

    throw new HttpException('Sender not part of conversation', HttpStatus.FORBIDDEN);
  }

  async findOrCreateConversation(senderId: string, recipientId: string) {
    if (!recipientId) {
      throw new HttpException('recipientId is required to create a new conversation', HttpStatus.BAD_REQUEST);
    }

    const pairKey = this.getPairKey(senderId, recipientId);
    let conversation = await this.conversationModel.findOne({ pairKey });

    if (!conversation) {
      conversation = await this.conversationModel.create({
        participantA: new Types.ObjectId(senderId),
        participantB: new Types.ObjectId(recipientId),
        pairKey,
        lastMessagePreview: '',
        unreadCountA: 0,
        unreadCountB: 0,
      });
    }

    return conversation;
  }

  async sendMessage(senderId: string, dto: SendMessageDto) {
    if (!dto.recipientId && !dto.conversationId) {
      throw new HttpException('recipientId or conversationId is required', HttpStatus.BAD_REQUEST);
    }

    let conversationId = dto.conversationId;
    let recipientId = dto.recipientId;

    if (!conversationId) {
      if (!recipientId) {
        throw new HttpException('recipientId is required to create a new conversation', HttpStatus.BAD_REQUEST);
      }
      const conversation = await this.findOrCreateConversation(senderId, recipientId);
      conversationId = conversation._id.toString();
    }

    if (!recipientId) {
      recipientId = await this.getConversationPartner(conversationId, senderId);
    }

    const message = await this.messageModel.create({
      conversationId: new Types.ObjectId(conversationId),
      senderId: new Types.ObjectId(senderId),
      content: dto.content,
      status: MessageStatus.SENT,
    });

    const conversation = await this.conversationModel.findById(conversationId);
    if (conversation) {
      conversation.lastMessagePreview = dto.content;
      conversation.lastMessageAt = (message as any).createdAt || new Date();
      if (conversation.participantA.toString() === senderId) {
        conversation.unreadCountB += 1;
      } else {
        conversation.unreadCountA += 1;
      }
      await conversation.save();
    }

    return {
      message,
      conversationId,
      recipientId,
    };
  }
}
