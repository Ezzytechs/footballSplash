import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  MAX_FILE_SIZE_BYTES,
  MAX_UPLOAD_FILES,
  StorageService,
} from './storage.service';

@ApiTags('Storage')
@ApiBearerAuth()
@Controller('storage')
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Post('upload')
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE_BYTES } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({
    summary: 'Upload a file to MEGA',
    description: `Accepts one file up to ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB. Restricted to ADMIN, EDITOR and AUTHOR.`,
  })
  upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('A file is required');
    }

    return this.storage.upload(file);
  }

  @Post('upload/batch')
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR)
  @UseInterceptors(
    FilesInterceptor('files', MAX_UPLOAD_FILES, {
      limits: { fileSize: MAX_FILE_SIZE_BYTES, files: MAX_UPLOAD_FILES },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['files'],
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Upload up to five files to MEGA',
    description: `Accepts up to ${MAX_UPLOAD_FILES} files of ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB each. Restricted to ADMIN, EDITOR and AUTHOR. Use the returned URLs as article images.`,
  })
  uploadBatch(@UploadedFiles() files?: Express.Multer.File[]) {
    if (!files?.length) {
      throw new BadRequestException('At least one file is required');
    }

    return this.storage.uploadFiles(files);
  }

  @Get(':nodeId/link')
  @ApiOperation({ summary: 'Get a public share link for a stored file' })
  getLink(@Param('nodeId') nodeId: string) {
    return this.storage.getLink(nodeId);
  }

  @Delete(':nodeId')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({
    summary: 'Delete a stored file',
    description: 'Restricted to ADMIN and EDITOR.',
  })
  remove(@Param('nodeId') nodeId: string) {
    return this.storage.remove(nodeId);
  }
}
