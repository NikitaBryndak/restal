import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { resolveArticleBySlug, serializeArticle } from "@/lib/articles";
import { EDITOR_PRIVILEGE_LEVEL, ADMIN_PRIVILEGE_LEVEL } from "@/config/constants";
import ArticleView from "./article-view";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  await connectToDatabase();

  const article = await resolveArticleBySlug(resolvedParams.slug);
  if (!article) notFound();

  // Drafts are only visible to editors/admins — everyone else gets a plain 404
  if (article.status === "draft") {
    const session = (await getServerSession(authOptions as any) as any);
    const level = session?.user?.privilegeLevel ?? 1;
    if (level !== EDITOR_PRIVILEGE_LEVEL && level !== ADMIN_PRIVILEGE_LEVEL) notFound();
  }

  return <ArticleView article={serializeArticle(article)} />;
}
