import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
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

  async findAll() {
    const users = await this.userModel.find().select('-password').lean();
    return users.map((user) => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      presenceStatus: user.presenceStatus,
      lastSeenAt: user.lastSeenAt,
    }));
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).select('-password').lean();
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: string) {
    return `This action removes a #${id} user`;
  }
}
