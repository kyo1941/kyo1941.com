import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import { BlogSummary } from "@/app/repository/blogRepository";
import { ROUTES } from "@/app/routes";

const cardBase = "group/card relative overflow-hidden sky-tile-link";

// 主役カードの横幅は従カードの数で決め、1枚しかないときに穴が空かないようにする。
function featuredSpan(restCount: number): string {
  if (restCount === 0) return "md:col-span-3";
  if (restCount === 1) return "md:col-span-2";
  return "md:col-span-2 md:row-span-2";
}

export default function BlogListSection({ blogs }: { blogs: BlogSummary[] }) {
  // ui/blog の一覧は均一グリッドだが、ホームだけ最新1件を大きく見せる例外レイアウトにしている
  const [featured, ...rest] = blogs;

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <h3 className="text-on-sky-subtle text-3xl font-bold text-gray-900">
          最新ブログ
        </h3>
        <Link
          href={ROUTES.BLOG}
          className="text-on-sky-subtle inline-flex items-center gap-1 font-mono text-sm text-accent transition-colors hover:text-accent-hover"
        >
          一覧へ
          <FiArrowRight aria-hidden className="h-4 w-4" />
        </Link>
      </div>

      {blogs.length === 0 ? (
        <div className="text-on-sky text-center text-gray-600">
          記事がまだありません。
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-3 md:auto-rows-fr">
          <Link
            href={`${ROUTES.BLOG}/${featured.slug}`}
            className={`${cardBase} ${featuredSpan(rest.length)} flex min-h-64 flex-col justify-end p-8`}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-accent-tint/70 to-transparent" />
            <div className="relative">
              <p className="font-mono text-[0.7rem] uppercase tracking-widest text-accent/80">
                最新記事
              </p>
              <h4 className="mt-2 line-clamp-2 text-2xl font-bold leading-snug text-gray-900">
                {featured.title}
              </h4>
              <p className="mt-2 font-mono text-xs tracking-wider text-gray-500">
                {featured.date}
              </p>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-700">
                {featured.description}
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-accent">
                続きを読む
                <span className="transition-transform duration-300 group-hover/card:translate-x-1">
                  ✈
                </span>
              </span>
            </div>
          </Link>

          {rest.map((blog) => (
            <Link
              key={blog.slug}
              href={`${ROUTES.BLOG}/${blog.slug}`}
              className={`${cardBase} flex flex-col p-6`}
            >
              <p className="font-mono text-xs tracking-wider text-gray-500">
                {blog.date}
              </p>
              <h4 className="mt-2 line-clamp-2 font-semibold leading-snug text-gray-900">
                {blog.title}
              </h4>
              <p className="mt-2 line-clamp-2 flex-grow text-sm text-gray-700">
                {blog.description}
              </p>
              <span className="mt-3 self-end text-sm text-accent transition-transform duration-300 group-hover/card:translate-x-1">
                ✈
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
