import { Body, Controller, Get, Param, Post, Req, UsePipes, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import type { Request } from 'express';

@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  findConversations(@Req() req: Request) {
    const tokenUser = (req as any).user;
    if (!tokenUser) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    return this.chatService.findUserConversations(tokenUser.sub);
  }

  @Get('conversations/:id/messages')
  findMessages(@Req() req: Request, @Param('id') conversationId: string) {
    const tokenUser = (req as any).user;
    if (!tokenUser) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    return this.chatService.findConversationMessages(conversationId);
  }

  @Post('message')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  sendMessage(@Req() req: Request, @Body() dto: SendMessageDto) {
    const tokenUser = (req as any).user;
    if (!tokenUser) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    return this.chatService.sendMessage(tokenUser.sub, dto);
  }
}
