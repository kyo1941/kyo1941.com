export type Portfolio = {
  slug: string;
  title: string;
  date: string;
  description: string;
  coverImage?: string | undefined;
  content: string;
  isDraft?: boolean;
};

export type AdminPortfolioListItem = Pick<
  Portfolio,
  "slug" | "title" | "date" | "description"
> & {
  isDraft: boolean;
};

export type PortfolioUpsertInput = {
  title: string;
  date: string;
  description: string;
  content: string;
  coverImage?: string;
  isDraft: boolean;
};

export type PortfolioFormValues = Required<PortfolioUpsertInput>;
