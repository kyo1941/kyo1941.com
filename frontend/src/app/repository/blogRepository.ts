export type { Blog, BlogSummary } from "@/app/types/blog";
import type { Blog, BlogSummary } from "@/app/types/blog";
import { API_BASE_URL, fetchJsonOrNull } from "@/app/network/publicApi";

export type BlogSearchParams = {
  limit?: number;
  tags?: string[];
  keyword?: string;
};

export class BlogRepository {
  async getSortedPostsData(params?: BlogSearchParams): Promise<BlogSummary[]> {
    const searchParams = new URLSearchParams();

    if (params?.limit) {
      searchParams.append("limit", params.limit.toString());
    }
    if (params?.tags && params.tags.length > 0) {
      params.tags.forEach((tag) => searchParams.append("tags", tag));
    }
    if (params?.keyword) {
      searchParams.append("keyword", params.keyword);
    }

    const queryString = searchParams.toString();
    const url = queryString
      ? `${API_BASE_URL}/api/blogs?${queryString}`
      : `${API_BASE_URL}/api/blogs`;
    const blogs = await fetchJsonOrNull<BlogSummary[]>(url);
    return blogs || [];
  }

  async getAllPostSlugs() {
    const blogs = await this.getSortedPostsData();

    return blogs.map((blog) => {
      return {
        params: {
          slug: blog.slug,
        },
      };
    });
  }

  async getPostData(slug: string): Promise<Blog | null> {
    return await fetchJsonOrNull<Blog>(`${API_BASE_URL}/api/blogs/${slug}`);
  }
}

export const blogRepository = new BlogRepository();
