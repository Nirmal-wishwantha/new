import { SetMetadata } from '@nestjs/common';
import { UserType } from '../../../entities/user.entity';

export const Roles = (...roles: UserType[]) => SetMetadata('roles', roles);