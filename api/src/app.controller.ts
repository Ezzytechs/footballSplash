import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './auth/decorators/public.decorator';
import { PrismaService } from './prisma/prisma.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('home')
  @ApiOperation({ summary: 'Check that the API is responding' })
  @ApiOkResponse({
    description: 'The API is running',
    schema: { type: 'string', example: 'Live api working!!!' },
  })
  getHome(): string {
    return 'Live api working!!!';
  }

  @Public()
  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check API and database health' })
  @ApiOkResponse({
    description: 'API health status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: { type: 'number', example: 123.45 },
        database: {
          type: 'string',
          enum: ['connected', 'disconnected', 'error'],
        },
      },
    },
  })
  async checkHealth() {
    let dbStatus = 'disconnected';
    try {
      // Simple DB ping query
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch {
      dbStatus = 'error';
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
    };
  }
}
