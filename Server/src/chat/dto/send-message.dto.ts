import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  recipientId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;
}
