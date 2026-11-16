"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiMenu, FiX } from "react-icons/fi";
import { ROUTES } from "@/app/routes";
import ThemeToggle from "./ThemeToggle";

const baseNavLink = `
  relative
  text-gray-900
  transition-colors duration-200
  after:absolute after:left-0 after:bottom-0 after:h-[2px] after:bg-current
`;

const animatedUnderline = `
  ${baseNavLink}
  after:w-0
  motion-safe:after:transition-all motion-safe:after:duration-200
  motion-reduce:after:transition-none
  hover:after:w-full focus-visible:after:w-full
`;

const activeUnderline = `
  ${baseNavLink}
  after:w-full
  motion-safe:after:transition-all motion-safe:after:duration-200
  motion-reduce:after:transition-none
`;

const navItems = [
  { id: "home", link: ROUTES.HOME, label: "ホーム" },
  { id: "profile", link: ROUTES.PROFILE, label: "プロフィール" },
  { id: "blog", link: ROUTES.BLOG, label: "ブログ" },
  { id: "portfolio", link: ROUTES.PORTFOLIO, label: "ポートフォリオ" },
];

function isActivePath(pathname: string | null, link: string): boolean {
  if (!pathname) return false;
  if (link === ROUTES.HOME) {
    return pathname === "/";
  }
  return pathname === link || pathname.startsWith(link + "/");
}

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";

    // Disable interactions on main content when drawer is open
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      if (isOpen) {
        mainContent.style.pointerEvents = "none";
      } else {
        mainContent.style.pointerEvents = "auto";
      }
    }

    return () => {
      document.body.style.overflow = "auto";
      if (mainContent) {
        mainContent.style.pointerEvents = "auto";
      }
    };
  }, [isOpen]);

  return (
    <>
      <header className="sticky top-0 h-(--header-height) w-full border-b border-surface/40 bg-surface/35 backdrop-blur-lg shadow-[0_4px_20px_-8px_rgba(30,64,120,0.25)] font-sans z-30">
        <div className="max-w-4xl w-full h-full mx-auto px-4 flex items-center justify-between">
          <Link
            href={ROUTES.HOME}
            className="text-2xl font-bold text-gray-900 transition-opacity hover:opacity-70"
          >
            kyo1941
          </Link>
          <div className="flex items-center gap-4 md:gap-8">
            <nav className="hidden md:flex">
              <ul className="flex gap-8 text-base font-semibold">
                {navItems.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.link}
                      className={`no-underline ${isActivePath(pathname, item.link) ? activeUnderline : animatedUnderline}`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <ThemeToggle />
            {/* Hamburger button (open only) */}
            <button
              className="md:hidden flex items-center justify-center w-8 h-8 text-gray-900"
              onClick={() => setIsOpen(true)}
              aria-label="メニューを開く"
              aria-expanded={isOpen}
            >
              <FiMenu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-40"
          onClick={closeMenu}
        />
      )}

      {/* Side drawer */}
      <div
        className={`md:hidden fixed top-0 right-0 h-full w-64 bg-surface/55 backdrop-blur-md shadow-xl z-50 transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Close button */}
        <div className="flex justify-end px-4 py-4">
          <button
            onClick={closeMenu}
            aria-label="メニューを閉じる"
            className="flex items-center justify-center w-8 h-8 text-gray-900"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>
        <ul className="flex flex-col">
          {navItems.map((item) => (
            <li
              key={item.id}
              className="mx-6 border-b border-gray-400 last:border-b-0"
            >
              <Link
                href={item.link}
                onClick={closeMenu}
                className="block -mx-6 px-6 py-4 no-underline text-gray-900 text-base font-semibold"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
