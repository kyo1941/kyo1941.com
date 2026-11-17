export type { Portfolio, PortfolioSummary } from "@/app/types/portfolio";
import type { Portfolio, PortfolioSummary } from "@/app/types/portfolio";
import { API_BASE_URL, fetchJsonOrNull } from "@/app/network/publicApi";

export type PortfolioSearchParams = {
  limit?: number;
};

export class PortfolioRepository {
  async getSortedPostsData(
    params?: PortfolioSearchParams,
  ): Promise<PortfolioSummary[]> {
    const searchParams = new URLSearchParams();

    if (params?.limit) {
      searchParams.append("limit", params.limit.toString());
    }

    const queryString = searchParams.toString();
    const url = queryString
      ? `${API_BASE_URL}/api/portfolios?${queryString}`
      : `${API_BASE_URL}/api/portfolios`;
    const portfolios = await fetchJsonOrNull<PortfolioSummary[]>(url);

    if (portfolios) {
      return portfolios.map((portfolio) => {
        if (portfolio.coverImage && portfolio.coverImage.startsWith("/")) {
          return {
            ...portfolio,
            coverImage: `${API_BASE_URL}${portfolio.coverImage}`,
          };
        }
        return portfolio;
      });
    }

    return [];
  }

  async getAllPostSlugs() {
    const portfolios = await this.getSortedPostsData();

    return portfolios.map((portfolio) => {
      return {
        params: {
          slug: portfolio.slug,
        },
      };
    });
  }

  async getPostData(slug: string): Promise<Portfolio | null> {
    const portfolio = await fetchJsonOrNull<Portfolio>(
      `${API_BASE_URL}/api/portfolios/${slug}`,
    );
    if (
      portfolio &&
      portfolio.coverImage &&
      portfolio.coverImage.startsWith("/")
    ) {
      portfolio.coverImage = `${API_BASE_URL}${portfolio.coverImage}`;
    }
    return portfolio;
  }
}

export const portfolioRepository = new PortfolioRepository();
