import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, ReorderTasksDto } from './dto/task.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { IAuthPayload, TaskStatus, TaskCategory } from '@task-management/data';

@Controller('tasks')
@UseGuards(RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto, @CurrentUser() user: IAuthPayload) {
    return this.tasksService.create(createTaskDto, user);
  }

  @Get()
  findAll(
    @CurrentUser() user: IAuthPayload,
    @Query('status') status?: TaskStatus,
    @Query('category') category?: TaskCategory,
    @Query('search') search?: string
  ) {
    return this.tasksService.findAll(user, { status, category, search });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: IAuthPayload) {
    return this.tasksService.findOne(id, user);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: IAuthPayload
  ) {
    return this.tasksService.update(id, updateTaskDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: IAuthPayload) {
    return this.tasksService.remove(id, user);
  }

  @Post('reorder')
  reorder(@Body() reorderDto: ReorderTasksDto, @CurrentUser() user: IAuthPayload) {
    return this.tasksService.reorder(reorderDto.taskIds, user);
  }
}
