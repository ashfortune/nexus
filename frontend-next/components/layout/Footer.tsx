"use client";

import { useState } from "react";
import Link from "next/link";
import { POLICIES } from "@/constants/policies";
import { PRIVACIES } from "@/constants/privacies";

type Item = {
    id: number;
    title: string;
    detail: string;
};

const GithubIcon = () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
        <path d="M12 .5C5.73.5.75 5.48.75 11.75c0 4.98 3.23 9.2 7.72 10.69.56.1.77-.24.77-.54v-1.9c-3.14.68-3.8-1.51-3.8-1.51-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.68.08-.68 1.13.08 1.72 1.16 1.72 1.16 1 .75 2.63 1.2 3.27.92.1-.72.39-1.2.71-1.48-2.51-.29-5.15-1.25-5.15-5.57 0-1.23.44-2.24 1.16-3.03-.12-.29-.5-1.45.11-3.02 0 0 .95-.3 3.11 1.16a10.7 10.7 0 0 1 5.66 0c2.16-1.46 3.11-1.16 3.11-1.16.61 1.57.23 2.73.11 3.02.72.79 1.16 1.8 1.16 3.03 0 4.33-2.65 5.28-5.17 5.56.4.35.76 1.04.76 2.1v3.11c0 .3.2.65.78.54a11.26 11.26 0 0 0 7.7-10.69C23.25 5.48 18.27.5 12 .5Z" />
    </svg>
);

const developers = [
    { name: "유재복", github: "ashfortune" },
    { name: "탁유제", github: "yujetak" },
    { name: "문광명", github: "moonkm00" },
    { name: "최지원", github: "choi-ahyeon" },
    { name: "강민재", github: "PandaGom7" },
];

function Modal({
                   title,
                   items,
                   onClose,
               }: {
    title: string;
    items: Item[];
    onClose: () => void;
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
            onClick={onClose}
        >
            <div
                className="w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-2xl bg-[var(--nexus-surface-lowest)] shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--nexus-outline-variant)]">
                    <h2 className="text-xl font-black text-[var(--nexus-primary)]">
                        {title}
                    </h2>

                    <button
                        onClick={onClose}
                        className="text-[var(--nexus-outline)] hover:text-[var(--nexus-primary)] text-xl"
                    >
                        ×
                    </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
                    <div className="grid gap-3 md:grid-cols-2">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className="rounded-xl bg-[var(--nexus-surface-container)] p-4"
                            >
                                <p className="font-bold text-sm text-[var(--nexus-primary)]">
                                    {item.id}. {item.title}
                                </p>
                                <p className="mt-2 text-sm text-[var(--nexus-on-bg)]">
                                    {item.detail}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 하단 */}
                <div className="border-t border-[var(--nexus-outline-variant)] px-6 py-4 text-right">
                    <button
                        onClick={onClose}
                        className="bg-[var(--nexus-primary)] text-[var(--nexus-on-primary)] px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
                    >확인
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Footer() {
    const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
    const [isTermsOpen, setIsTermsOpen] = useState(false);

    return (
        <>
            <footer className="w-full bg-[var(--nexus-surface-low)] text-[var(--nexus-on-bg)]">
                <div className="mx-auto max-w-6xl px-6 py-14">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

                        <div className="flex flex-col gap-4">
                            <Link href="/" className="text-4xl font-black text-[var(--nexus-primary)]">
                                NEXUS
                            </Link>

                            <p className="text-sm text-[var(--nexus-outline)]">
                                아이디어에서 운영까지, 당신의 AI 공동 창업자
                            </p>
                        </div>

                        <div className="flex flex-col gap-4">
                            <p className="text-lg font-black text-[var(--nexus-primary)]">
                                Policy
                            </p>

                            <div className="flex flex-col gap-3 text-sm font-semibold">
                                <button
                                    onClick={() => setIsPrivacyOpen(true)}
                                    className="text-left hover:text-[var(--nexus-primary)]"
                                >
                                    개인정보처리방침
                                </button>

                                <button
                                    onClick={() => setIsTermsOpen(true)}
                                    className="text-left hover:text-[var(--nexus-primary)]"
                                >
                                    이용약관
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <p className="text-lg font-black text-[var(--nexus-primary)]">
                                Developers
                            </p>

                            <div className="flex flex-wrap gap-2">
                                {developers.map((dev) => (
                                    <Link
                                        key={dev.github}
                                        href={`https://github.com/${dev.github}`}
                                        target="_blank"
                                        className="flex items-center rounded-md overflow-hidden text-xs font-bold hover:scale-105 transition"
                                    >
                    <span className="flex items-center gap-1 bg-[var(--nexus-primary)] text-white px-2 py-1">
                      <GithubIcon />
                      GitHub
                    </span>
                                        <span className="bg-[var(--nexus-surface-lowest)] px-2 py-1 text-[var(--nexus-primary)]">
                      {dev.name}
                    </span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                <div className="border-t border-[var(--nexus-outline-variant)] py-4 text-center text-xs text-[var(--nexus-outline)]">
                    Copyright Ⓒ 2026 NEXUS
                </div>
            </footer>

            {isPrivacyOpen && (
                <Modal
                    title="개인정보처리방침"
                    items={PRIVACIES}
                    onClose={() => setIsPrivacyOpen(false)}
                />
            )}
            {isTermsOpen && (
                <Modal
                    title="서비스 이용약관"
                    items={POLICIES}
                    onClose={() => setIsTermsOpen(false)}
                />
            )}
        </>
    );
}