import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserType, UserStatus } from '../../../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { ClerkService } from './clerk.service';
import { SupabaseService } from '../../database/supabase.service';
import { ClerkUser } from '../../../config/clerk.config';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private clerkService: ClerkService,
    private supabaseService: SupabaseService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: [
        { clerk_user_id: createUserDto.clerk_user_id },
        { email: createUserDto.email },
        { username: createUserDto.username },
      ],
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const clerkUser = await this.clerkService.createUser({
      emailAddress: createUserDto.email,
      firstName: createUserDto.first_name,
      lastName: createUserDto.last_name,
      username: createUserDto.username,
    });

    if (!clerkUser) {
      throw new ConflictException('Failed to create user in Clerk');
    }

    const user = this.userRepository.create({
      ...createUserDto,
      clerk_user_id: clerkUser.id,
    });
    const savedUser = await this.userRepository.save(user);

    await this.supabaseService.upsertUser({
      user_id: savedUser.user_id,
      clerk_user_id: savedUser.clerk_user_id,
      email: savedUser.email,
      username: savedUser.username,
      first_name: savedUser.first_name,
      last_name: savedUser.last_name,
      user_type: savedUser.user_type,
    });

    this.logger.log(`User created: ${savedUser.user_id}`);
    return savedUser;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    userType?: UserType,
    status?: UserStatus,
  ): Promise<{ users: User[]; total: number; pages: number }> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (userType) {
      queryBuilder.andWhere('user.user_type = :userType', { userType });
    }

    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    const total = await queryBuilder.getCount();
    const users = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('user.created_at', 'DESC')
      .getMany();

    return {
      users,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { user_id: id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByClerkId(clerkUserId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { clerk_user_id: clerkUserId },
    });

    if (!user) {
      throw new NotFoundException(`User with Clerk ID ${clerkUserId} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);

    if (updateUserDto.first_name || updateUserDto.last_name || updateUserDto.username) {
      await this.syncWithClerk(user.clerk_user_id, updateUserDto);
      await this.supabaseService.upsertUser({
        user_id: updatedUser.user_id,
        clerk_user_id: updatedUser.clerk_user_id,
        email: updatedUser.email,
        username: updatedUser.username,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        user_type: updatedUser.user_type,
      });
    }

    this.logger.log(`User updated: ${updatedUser.user_id}`);
    return updatedUser;
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      last_login: new Date(),
    });
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);

    user.status = UserStatus.DELETED;
    await this.userRepository.save(user);

    await this.clerkService.deleteUser(user.clerk_user_id);
    await this.supabaseService.getClient().from('users').delete().eq('user_id', id);

    this.logger.log(`User deleted: ${id}`);
  }

  async syncUserFromClerk(clerkUser: ClerkUser): Promise<User> {
    let user = await this.userRepository.findOne({
      where: { clerk_user_id: clerkUser.id },
    });

    const userData = {
      clerk_user_id: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress,
      first_name: clerkUser.firstName || '',
      last_name: clerkUser.lastName || '',
      username: clerkUser.username || clerkUser.emailAddresses[0]?.emailAddress.split('@')[0],
      avatar_url: clerkUser.imageUrl,
      email_verified: clerkUser.emailAddresses[0]?.verification?.status === 'verified',
      phone: clerkUser.phoneNumbers?.[0]?.phoneNumber,
      phone_verified: clerkUser.phoneNumbers?.[0]?.verification?.status === 'verified',
    };

    if (user) {
      Object.assign(user, userData);
      user = await this.userRepository.save(user);
    } else {
      user = await this.create(userData as CreateUserDto);
    }

    await this.supabaseService.upsertUser({
      user_id: user.user_id,
      clerk_user_id: user.clerk_user_id,
      email: user.email,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      user_type: user.user_type,
    });

    return user;
  }

  async changeUserType(userId: string, userType: UserType): Promise<User> {
    const user = await this.findOne(userId);
    user.user_type = userType;
    const updatedUser = await this.userRepository.save(user);

    await this.supabaseService.upsertUser({
      user_id: updatedUser.user_id,
      clerk_user_id: updatedUser.clerk_user_id,
      email: updatedUser.email,
      username: updatedUser.username,
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      user_type: updatedUser.user_type,
    });

    return updatedUser;
  }

  async updatePreferences(userId: string, preferences: Record<string, any>): Promise<User> {
    const user = await this.findOne(userId);
    user.preferences = { ...user.preferences, ...preferences };
    return this.userRepository.save(user);
  }

  private async syncWithClerk(clerkUserId: string, updateData: Partial<UpdateUserDto>): Promise<void> {
    try {
      const clerkData: Partial<ClerkUser> = {};

      if (updateData.first_name) clerkData.firstName = updateData.first_name;
      if (updateData.last_name) clerkData.lastName = updateData.last_name;
      if (updateData.username) clerkData.username = updateData.username;

      await this.clerkService.updateUser(clerkUserId, clerkData);
    } catch (error) {
      this.logger.warn(`Failed to sync user with Clerk: ${error.message}`);
    }
  }
}