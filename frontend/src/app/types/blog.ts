export type Blog = {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags?: string[];
  content: string;
  isDraft?: boolean;
};

export type AdminBlogListItem = Pick<
  Blog,
  "slug" | "title" | "date" | "description"
> & {
  tags: string[];
  isDraft: boolean;
};

export type BlogUpsertInput = {
  title: string;
  date: string;
  description: string;
  content: string;
  tags: string[];
  isDraft: boolean;
};

export type BlogFormValues = BlogUpsertInput;
