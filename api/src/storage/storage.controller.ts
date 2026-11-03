import 'multer';
import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  Body,
  Req,
  BadRequestException,
  NotFoundException,
  HttpStatus,
  HttpCode,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { StorageService } from './storage.service';
import { UploadFileDto } from './dto/upload-file.dto';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  /**
   * POST /storage/upload
   * Upload a file to a MEGA folder and return its metadata + viewable URL.
   */
  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadFileDto,
    @Req() req: Request,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const folder = body.folder || 'uploads';
    const fileName = file.originalname;

    const result = await this.storageService.upload({
      buffer: file.buffer,
      originalname: fileName,
      mimetype: file.mimetype,
      size: file.size,
    });

    // Build the full viewable URL. Prefer the proxy-forwarded protocol/host
    // (set by Vercel / reverse proxies) so the stored URL is always the public
    // https URL — otherwise the image is blocked as mixed content in the browser.
    const protocol = String(
      req.headers['x-forwarded-proto'] || req.protocol,
    ).split(',')[0].trim();
    const host = String(
      req.headers['x-forwarded-host'] || req.get('host') || '',
    ).split(',')[0].trim();
    const baseUrl = `${protocol}://${host}`;
    // Include the global prefix (app.setGlobalPrefix('api/v1')) so the URL is
    // actually reachable when used verbatim.
    const viewUrl = `${baseUrl}/api/v1/storage/view/${result.nodeId}?folder=${folder}`;

    return {
      success: true,
      message: 'File uploaded successfully',
      data: {
        nodeId: result.nodeId,
        name: result.name,
        size: result.size,
        mimetype: file.mimetype,
        folder,
        url: viewUrl,
      },
    };
  }

  /**
   * GET /storage/view/:nodeId?folder=uploads
   * Stream a file from MEGA through the API proxy.
   * Public: <img> tags cannot send a Bearer token, and article images are
   * meant to be viewable by anyone reading the story.
   */
  @Public()
  @Get('view/:nodeId')
  async viewFile(
    @Param('nodeId') nodeId: string,
    @Query('folder') folder: string,
    @Res() res: Response,
  ) {
    try {
      const folderName = folder || 'uploads';
      const file = await this.storageService.getFileStream(nodeId, folderName);

      const info =
        await this.storageService.getFileInfo(nodeId, folderName);
      const ext = info.name.split('.').pop()?.toLowerCase() || '';
      const mimeMap: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml',
        pdf: 'application/pdf',
        mp4: 'video/mp4',
        mp3: 'audio/mpeg',
      };
      const contentType = mimeMap[ext] || 'application/octet-stream';

      res.setHeader('Content-Type', contentType);
      res.setHeader(
        'Cache-Control',
        'public, max-age=31536000, immutable',
      );
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${info.name}"`,
      );

      file.stream.on('error', () => res.destroy());
      file.stream.pipe(res);
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  /**
   * DELETE /storage/:nodeId?folder=uploads
   * Delete a file from MEGA by nodeId.
   */
  @Delete(':nodeId')
  @HttpCode(HttpStatus.OK)
  async deleteFile(
    @Param('nodeId') nodeId: string,
    @Query('folder') folder: string,
  ) {
    const folderName = folder || 'uploads';
    const message = await this.storageService.deleteFile(
      nodeId,
      folderName,
    );

    return {
      success: true,
      message,
    };
  }
}
