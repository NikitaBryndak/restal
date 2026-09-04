import type { MetadataRoute } from "next";
import { BASE_URL } from "@/config/constants";
import { connectToDatabase } from "@/lib/mongodb";
import Article from "@/models/article";
import { PUBLISHED_ARTICLE_QUERY } from "@/lib/articles";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = BASE_URL;

  // Static page
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/cashback`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/info`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tour-screener`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/managers`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  // Published articles only — drafts are excluded from the index
  let articlePages: MetadataRoute.Sitemap = [];
  try {
    await connectToDatabase();
    const articles = await Article.find(PUBLISHED_ARTICLE_QUERY)
      .select("articleID _id updatedAt")
      .lean();
    articlePages = articles.map((a) => ({
      url: `${baseUrl}/info/${String(a._id)}`,
      lastModified: a.updatedAt ?? new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    }));
  } catch (error) {
    console.error("Error generating article sitemap entries:", error);
  }

  return [...staticPages, ...articlePages];
}
