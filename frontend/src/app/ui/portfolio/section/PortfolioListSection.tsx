import Link from "next/link";
import Image from "next/image";
import type { PortfolioSummary } from "@/app/repository/portfolioRepository";
import { ROUTES } from "@/app/routes";

export default function PortfolioListSection({
  portfolios,
}: {
  portfolios: PortfolioSummary[];
}) {
  return (
    <div className="flex flex-col gap-8">
      {portfolios.length === 0 ? (
        <div className="text-on-sky text-center text-gray-600">
          ポートフォリオがまだありません。
        </div>
      ) : (
        portfolios.map((portfolio) => (
          <Link
            href={`${ROUTES.PORTFOLIO}/${portfolio.slug}`}
            key={portfolio.slug}
            className="group/card sky-tile-link flex flex-col items-stretch overflow-hidden md:flex-row"
          >
            {portfolio.coverImage && (
              <div className="relative h-48 w-full md:h-auto md:w-1/3">
                <Image
                  src={portfolio.coverImage}
                  alt={portfolio.title}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 hidden bg-gradient-to-r from-transparent via-tile/20 to-tile/80 md:block" />
              </div>
            )}
            <div
              className={`${portfolio.coverImage ? "md:w-2/3" : "md:w-full"} flex w-full flex-col p-6`}
            >
              <h4 className="mb-2 text-xl font-semibold text-gray-900 transition-colors group-hover/card:text-accent">
                {portfolio.title}
              </h4>
              <p className="mb-4 font-mono text-xs tracking-wider text-gray-500">
                {portfolio.date}
              </p>
              <p className="mb-4 flex-grow text-base text-gray-700">
                {portfolio.description}
              </p>
              <span className="mt-auto inline-flex items-center gap-2 self-end text-sm font-medium text-accent">
                詳細を見る
                <span
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover/card:translate-x-1"
                >
                  ✈
                </span>
              </span>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
