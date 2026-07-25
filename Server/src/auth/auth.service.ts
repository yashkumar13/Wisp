import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/user/schemas/user.schema';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { blacklistToken } from './auth.middleware';

@Injectable()
export class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET || process.env.SECRET_KEY || 'defaultJwtSecret';

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async findUserByEmail(email: string) {
    try {
      const user = await this.userModel.findOne({ email });
      if (!user) {
        throw new HttpException('User Not Found', HttpStatus.BAD_REQUEST);
      }

      return {
        data: user,
        success: true,
        message: 'Found User',
        status: HttpStatus.FOUND,
      };
    } catch (error) {
      throw new HttpException(
        'User Not Found',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async login(email: string, password: string) {
    try {
      console.log("working in login");
      
      const user = await this.userModel.findOne({ email });
      if (!user) {
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }

      const passwordMatches = await bcrypt.compare(password, user.password);
      if (!passwordMatches) {
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }

      const token = jwt.sign(
        {
          sub: user._id.toString(),
          email: user.email,
          username: user.username,
        },
        this.jwtSecret,
        { expiresIn: '1h' },
      );

      const userObject = user.toObject ? user.toObject() : user;
      const { password: _, ...safeUser } = userObject as Record<string, any>;

      return {
        success: true,
        message: 'Login successful',
        status: HttpStatus.OK,
        accessToken: token,
        user: safeUser,
      };
    } catch (error) {
      console.log(error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Login failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async logout(token: string) {
    if (!token) {
      throw new HttpException('Authorization token missing', HttpStatus.BAD_REQUEST);
    }

    try {
      jwt.verify(token, this.jwtSecret);
      blacklistToken(token);

      return {
        success: true,
        message: 'Logout successful',
        status: HttpStatus.OK,
      };
    } catch (error) {
      throw new HttpException('Invalid or expired token', HttpStatus.UNAUTHORIZED);
    }
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
