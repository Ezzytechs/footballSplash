import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MutableFile, Storage } from 'megajs';
import { basename } from 'node:path';

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
export const MAX_UPLOAD_FILES = 5;

export interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class StorageService implements OnModuleDestroy {
  private readonly logger = new Logger(StorageService.name);
  private client?: Storage;
  private connecting?: Promise<Storage>;

  constructor(private readonly config: ConfigService) {}

  private get email(): string | undefined {
    return this.config.get<string>('MEGA_EMAIL');
  }

  private get password(): string | undefined {
    return this.config.get<string>('MEGA_PASSWORD');
  }

  private get folderPath(): string {
    return this.config.get<string>('MEGA_FOLDER') ?? '';
  }

  async upload(file: UploadedFile) {
    if (!file.buffer?.length) {
      throw new BadRequestException('A non-empty file is required');
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `File exceeds the ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB limit`,
      );
    }

    const storage = await this.getClient();
    const folder = await this.resolveFolder(storage);
    const name = buildFileName(file.originalname);

    try {
      const upload = folder.upload(
        { name, size: file.size },
        file.buffer,
      ) as ReturnType<Storage['upload']>;
      const uploaded = await upload.complete;
      const url = await uploaded.link({});

      return {
        name: uploaded.name ?? name,
        size: uploaded.size ?? file.size,
        mimeType: file.mimetype,
        nodeId: uploaded.nodeId,
        url,
      };
    } catch (error) {
      this.logger.error(
        `MEGA upload failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException(
        'Unable to store the uploaded file',
      );
    }
  }

  async uploadFiles(files: UploadedFile[]) {
    if (!files.length) {
      throw new BadRequestException('At least one file is required');
    }

    if (files.length > MAX_UPLOAD_FILES) {
      throw new BadRequestException(
        `At most ${MAX_UPLOAD_FILES} files can be uploaded at once`,
      );
    }

    const uploaded: Awaited<ReturnType<StorageService['upload']>>[] = [];
    for (const file of files) {
      uploaded.push(await this.upload(file));
    }

    return uploaded;
  }

  async getLink(nodeId: string) {
    const file = await this.findFile(nodeId);
    const url = await file.link({});

    return { nodeId, name: file.name, url };
  }

  async remove(nodeId: string) {
    const file = await this.findFile(nodeId);

    try {
      await file.delete();
    } catch (error) {
      this.logger.error(
        `MEGA delete failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException('Unable to delete the file');
    }

    return { message: 'File deleted' };
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = undefined;
    }
  }

  private async findFile(nodeId: string): Promise<MutableFile> {
    const storage = await this.getClient();
    const file = storage.find((node) => node.nodeId === nodeId, true);

    if (!file || file.directory) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  private async getClient(): Promise<Storage> {
    const email = this.email;
    const password = this.password;

    if (!email || !password) {
      throw new ServiceUnavailableException(
        'File storage is not configured. Set MEGA_EMAIL and MEGA_PASSWORD.',
      );
    }

    if (this.client) {
      return this.client;
    }

    if (!this.connecting) {
      this.connecting = this.connect(email, password);
    }

    try {
      return await this.connecting;
    } finally {
      this.connecting = undefined;
    }
  }

  private async connect(email: string, password: string): Promise<Storage> {
    const storage = new Storage({ email, password });

    try {
      await storage.ready;
    } catch (error) {
      this.logger.error(
        `MEGA login failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      await storage.close().catch(() => undefined);
      throw new ServiceUnavailableException(
        'Unable to connect to file storage',
      );
    }

    this.logger.log('Connected to MEGA storage');
    this.client = storage;

    return storage;
  }

  private async resolveFolder(storage: Storage): Promise<MutableFile> {
    let folder = storage.root;

    for (const segment of this.folderPath.split('/')) {
      const name = segment.trim();
      if (!name) {
        continue;
      }

      const existing = folder.children?.find(
        (child) => child.directory && child.name === name,
      );
      folder = existing ?? (await folder.mkdir(name));
    }

    return folder;
  }
}

function buildFileName(originalName: string): string {
  const safeName = basename(originalName)
    .replace(/[^\w.-]+/g, '_')
    .slice(-100);

  return `${Date.now()}-${safeName || 'file'}`;
}
