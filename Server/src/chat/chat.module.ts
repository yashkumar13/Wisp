import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Conversation, ConversationSchema } from 'src/user/schemas/conversation.schema';
import { Message, MessageSchema } from 'src/user/schemas/message.schema';
import { PresenceService } from './presence.service'
import { ChatController } from './chat.controller';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || configService.get<string>('SECRET_KEY') || 'defaultJwtSecret',
      }),
    }),
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService, PresenceService],
})
export class ChatModule {}
