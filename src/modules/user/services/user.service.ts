// ===== src/modules/user/user.service.ts =====
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserType, UserStatus } from '../../../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return await this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { user_id: id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByClerkId(clerkId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { clerk_user_id: clerkId } });
    if (!user) {
      throw new NotFoundException(`User with Clerk ID ${clerkId} not found`);
    }
    return user;
  }

  async findByClerkIdSafe(clerkId: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { clerk_user_id: clerkId } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    await this.userRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      last_login: new Date(),
    });
    this.logger.log(`Updated last login for user: ${userId}`);
  }

  async syncUserFromClerk(clerkUserData: any): Promise<User> {
    const existingUser = await this.findByClerkIdSafe(clerkUserData.id);

    const userData = {
      clerk_user_id: clerkUserData.id,
      email: clerkUserData.email_addresses?.[0]?.email_address || clerkUserData.email,
      username: clerkUserData.username || clerkUserData.email_addresses?.[0]?.email_address?.split('@')[0],
      first_name: clerkUserData.first_name || '',
      last_name: clerkUserData.last_name || '',
      phone: clerkUserData.phone_numbers?.[0]?.phone_number || null,
      avatar_url: clerkUserData.image_url || clerkUserData.profile_image_url || null,
      email_verified: clerkUserData.email_addresses?.[0]?.verification?.status === 'verified' || false,
      phone_verified: clerkUserData.phone_numbers?.[0]?.verification?.status === 'verified' || false,
      user_type: UserType.GUEST,
      status: UserStatus.ACTIVE,
    };

    if (existingUser) {
      // Update existing user
      await this.userRepository.update(existingUser.user_id, {
        ...userData,
        updated_at: new Date(),
      });
      this.logger.log(`Updated user from Clerk: ${clerkUserData.id}`);
      return this.findOne(existingUser.user_id);
    } else {
      // Create new user
      const newUser = this.userRepository.create(userData);
      const savedUser = await this.userRepository.save(newUser);
      this.logger.log(`Created new user from Clerk: ${clerkUserData.id}`);
      return savedUser;
    }
  }
}