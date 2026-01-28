import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPost } from './entities/blog-post.entity';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(BlogPost)
    private blogPostsRepository: Repository<BlogPost>,
  ) {}

  async create(data: Partial<BlogPost>): Promise<BlogPost> {
    const post = this.blogPostsRepository.create(data);
    return this.blogPostsRepository.save(post);
  }

  async findAll(query: any = {}): Promise<{ posts: BlogPost[]; total: number }> {
    const { page = 1, limit = 10, tag } = query;

    const queryBuilder = this.blogPostsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.isPublished = :isPublished', { isPublished: true });

    if (tag) {
      queryBuilder.andWhere(':tag = ANY(post.tags)', { tag });
    }

    const total = await queryBuilder.getCount();

    const posts = await queryBuilder
      .orderBy('post.publishedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { posts, total };
  }

  async findBySlug(slug: string): Promise<BlogPost> {
    const post = await this.blogPostsRepository.findOne({
      where: { slug, isPublished: true },
      relations: ['author'],
    });
    if (!post) {
      throw new NotFoundException('Blog yazısı bulunamadı');
    }
    await this.blogPostsRepository.increment({ id: post.id }, 'viewCount', 1);
    return post;
  }

  async findById(id: string): Promise<BlogPost> {
    const post = await this.blogPostsRepository.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!post) {
      throw new NotFoundException('Blog yazısı bulunamadı');
    }
    return post;
  }

  async update(id: string, data: Partial<BlogPost>): Promise<BlogPost> {
    const post = await this.findById(id);
    Object.assign(post, data);
    return this.blogPostsRepository.save(post);
  }

  async publish(id: string): Promise<BlogPost> {
    const post = await this.findById(id);
    post.isPublished = true;
    post.publishedAt = new Date();
    return this.blogPostsRepository.save(post);
  }

  async delete(id: string): Promise<void> {
    const post = await this.findById(id);
    await this.blogPostsRepository.remove(post);
  }

  async findRecent(limit: number = 5): Promise<BlogPost[]> {
    return this.blogPostsRepository.find({
      where: { isPublished: true },
      order: { publishedAt: 'DESC' },
      take: limit,
    });
  }
}
