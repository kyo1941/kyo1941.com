"use client";

import Link from "next/link";
import { useBlogList } from "@/app/hooks/blog/useBlogList";
import type { BlogSummary } from "@/app/repository/blogRepository";
import { ROUTES } from "@/app/routes";

export default function BlogListSection({
  initialBlogs,
}: {
  initialBlogs: BlogSummary[];
}) {
  const { blogs } = useBlogList(initialBlogs);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-12">
        {blogs.length === 0 ? (
          <div className="text-on-sky col-span-full text-center text-gray-600">
            記事がまだありません。
          </div>
        ) : (
          blogs.map((blog) => (
            <Link
              href={`${ROUTES.BLOG}/${blog.slug}`}
              key={blog.slug}
              className="group/card flex flex-col p-7 sky-tile-link"
            >
              <p className="font-mono text-xs tracking-wider text-gray-500">
                {blog.date}
              </p>
              <div className="mt-2 flex min-h-28 flex-col">
                <h3 className="line-clamp-2 font-semibold leading-snug text-gray-900">
                  {blog.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-gray-700">
                  {blog.description}
                </p>
              </div>
              <span className="mt-4 inline-flex items-center gap-2 self-start text-sm font-medium text-accent">
                続きを読む
                <span className="transition-transform duration-300 group-hover/card:translate-x-1">
                  ✈
                </span>
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
