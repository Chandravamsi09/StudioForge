import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { BuildsService } from './builds.service';
import { CreateBuildDto } from './dto/create-build.dto';
import { UpdateBuildDto } from './dto/update-build.dto';
import { QueryBuildsDto } from './dto/query-builds.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Build Pipelines')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('builds')
export class BuildsController {
  constructor(private readonly buildsService: BuildsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new game build artifact / pipeline run' })
  @ApiResponse({ status: 201, description: 'Build successfully created' })
  async createBuild(@CurrentUser() user: any, @Body() dto: CreateBuildDto) {
    return this.buildsService.createBuild(user.tenantId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all builds for the studio with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated builds list returned' })
  async findAll(@CurrentUser() user: any, @Query() query: QueryBuildsDto) {
    return this.buildsService.findAll(user.tenantId, query);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Retrieve build pipeline statistics & success rates' })
  @ApiResponse({ status: 200, description: 'Pipeline metrics returned' })
  async getMetrics(@CurrentUser() user: any) {
    return this.buildsService.getMetrics(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific build by ID' })
  @ApiParam({ name: 'id', description: 'Build UUID' })
  @ApiResponse({ status: 200, description: 'Build details returned' })
  @ApiResponse({ status: 404, description: 'Build not found' })
  async findById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.buildsService.findById(user.tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update build status, duration, or artifact metadata' })
  @ApiParam({ name: 'id', description: 'Build UUID' })
  @ApiResponse({ status: 200, description: 'Build updated' })
  @ApiResponse({ status: 404, description: 'Build not found' })
  async updateBuild(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateBuildDto,
  ) {
    return this.buildsService.updateBuild(user.tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a build record' })
  @ApiParam({ name: 'id', description: 'Build UUID' })
  @ApiResponse({ status: 200, description: 'Build deleted' })
  @ApiResponse({ status: 404, description: 'Build not found' })
  async deleteBuild(@CurrentUser() user: any, @Param('id') id: string) {
    return this.buildsService.deleteBuild(user.tenantId, id);
  }
}
