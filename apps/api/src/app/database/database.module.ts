import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import { User, Organization, Task } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([User, Organization, Task])],
  providers: [SeederService],
  exports: [SeederService],
})
export class DatabaseModule {}
