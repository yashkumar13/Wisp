import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ){}
  async create(createUserDto: CreateUserDto) {
    try{

      const { username , email , password} = createUserDto
      console.log(createUserDto)
    const newPassword = await bcrypt.hash(password, 10);
    const newUser = await this.userModel.create({
      username,
      email,
      password: newPassword
    });

    return {
      data: newUser,
      message: 'User created successfully',
      status: HttpStatus.CREATED,
      statusCode: HttpStatus.CREATED
    };
    }catch (error:any) {
      console.log(error)
      if(error.code === 11000){
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }
      throw new HttpException('Error creating user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: string) {
    return `This action returns a #${id} user`;
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: string) {
    return `This action removes a #${id} user`;
  }
}
