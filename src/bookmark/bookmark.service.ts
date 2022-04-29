import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { EditBookmarkDto } from './dto/edit-bookmark.dto';

@Injectable()
export class BookmarkService {
  constructor(private prismaService: PrismaService) {}

  getBookmarks(userId: number) {
    return this.prismaService.bookmark.findMany({
      where: {
        userId,
      },
    });
  }

  getBookmarkById(userId: number, bookmarkId: number) {
    return this.prismaService.bookmark.findFirst({
      where: {
        userId,
        id: bookmarkId,
      },
    });
  }

  async createBookmark(userId: number, dto: CreateBookmarkDto) {
    const bookmark = this.prismaService.bookmark.create({
      data: {
        userId,
        ...dto,
      },
    });

    return bookmark;
  }

  async editBookmarkById(
    userId: number,
    bookmarkId: number,
    dto: EditBookmarkDto,
  ) {
    // Get bookmark byid
    const getBookmark = await this.prismaService.bookmark.findUnique({
      where: {
        id: bookmarkId,
      },
    });

    // Check if user owns the bookmark
    if (!getBookmark || getBookmark.userId !== userId)
      throw new ForbiddenException('Access to resource denied');

    // return updated bookmark
    return this.prismaService.bookmark.update({
      where: {
        id: bookmarkId,
      },
      data: {
        ...dto,
      },
    });
  }

  async deleteBookmarkById(userId: number, bookmarkId: number) {
    // Get bookmark byid
    const getBookmark = await this.prismaService.bookmark.findUnique({
      where: {
        id: bookmarkId,
      },
    });

    // Check if user owns the bookmark
    if (!getBookmark || getBookmark.userId !== userId)
      throw new ForbiddenException('Access to resource denied');

    // Return deleted resource
    return await this.prismaService.bookmark.delete({
      where: {
        id: bookmarkId,
      },
    });
  }
}
