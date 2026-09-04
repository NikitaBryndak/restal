import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import Article from '@/models/article';
import { getServerSession } from 'next-auth';
import { logAudit } from '@/lib/audit';
import Role from '@/models/role';
import { invalidateRoleCache } from '@/lib/role-cache';
import { GET as listArticles, POST as createArticle } from '@/app/api/articles/route';
import { GET as getArticleById } from '@/app/api/articles/[id]/route';

// Replace only the session lookup; keep every other next-auth export intact.
vi.mock('next-auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-auth')>();
  return { ...actual, getServerSession: vi.fn() };
});

// Audit writes are fire-and-forget in the routes — assert the call contract instead of DB state.
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn().mockResolvedValue(undefined) }));

const mockGetServerSession = vi.mocked(getServerSession);
const mockLogAudit = vi.mocked(logAudit);

function session(phoneNumber: string, role: string) {
  return { user: { phoneNumber, role } };
}

beforeEach(async () => {
  mockGetServerSession.mockReset();
  mockLogAudit.mockClear();
  invalidateRoleCache();
  await Role.create({ slug: 'client', name: 'Клієнт', isSystem: true, groups: ['client'], pageOverrides: {} });
  await Role.create({ slug: 'editor', name: 'Редактор', isSystem: true, groups: ['client', 'articles'], pageOverrides: {} });
  await Role.create({ slug: 'admin', name: 'Адмін', isSystem: true, groups: ['client', 'articles', 'tours', 'admin'], pageOverrides: {} });
});


async function seedArticle(overrides: Record<string, unknown> = {}) {
  return Article.create({
    articleID: 100,
    tag: 'news',
    images: ['https://img.example/cover.jpg'],
    title: 'Published Story',
    description: 'A published story',
    content: '<p>Body</p>',
    status: 'published',
    creatorPhone: '+380671000001',
    ...overrides,
  });
}

// Bypasses schema defaults so the stored doc truly has no `status` field (legacy shape).
async function seedLegacyArticle(overrides: Record<string, unknown> = {}) {
  const doc = {
    articleID: 900,
    tag: 'old',
    images: 'https://img.example/legacy-single.jpg',
    title: 'Legacy Story',
    description: 'Pre-migration story',
    content: '<p>Old body</p>',
    creatorPhone: '+380671000002',
    ...overrides,
  };
  await Article.collection.insertOne(doc);
}

describe('POST /api/articles', () => {
  function post(body: Record<string, unknown>) {
    return createArticle(
      new NextRequest('http://localhost/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    );
  }

  const validBody = {
    title: 'New Story',
    description: 'Fresh story',
    content: '<p>Fresh</p>',
    tag: 'news',
    images: ['https://img.example/a.jpg', 'https://img.example/b.jpg'],
  };

  it('returns 401 without a session and 403 for non-editors', async () => {
    mockGetServerSession.mockResolvedValue(null as never);
    expect((await post(validBody)).status).toBe(401);

    mockGetServerSession.mockResolvedValue(session('+380672000001', 'client') as never);
    expect((await post(validBody)).status).toBe(403);
  });

  it('creates a draft with an image array and logs article.created', async () => {
    mockGetServerSession.mockResolvedValue(session('+380672000001', 'editor') as never);

    const res = await post({ ...validBody, status: 'draft' });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { article: Record<string, unknown> };
    expect(body.article.images).toEqual(['https://img.example/a.jpg', 'https://img.example/b.jpg']);
    expect(body.article.status).toBe('draft');

    expect(mockLogAudit).toHaveBeenCalledTimes(1);
    const call = mockLogAudit.mock.calls[0][0];
    expect(call.action).toBe('article.created');
    expect(call.entityType).toBe('article');
    expect(call.userId).toBe('+380672000001');
    expect(call.details).toMatchObject({ title: 'New Story' });
  });

  it('normalizes a legacy single-string image into an array and defaults to published', async () => {
    mockGetServerSession.mockResolvedValue(session('+380672000001', 'admin') as never);

    const res = await post({ ...validBody, images: 'https://img.example/one.jpg' });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { article: Record<string, unknown> };
    expect(body.article.images).toEqual(['https://img.example/one.jpg']);
    expect(body.article.status).toBe('published');
  });

  it('rejects empty or missing images with 400', async () => {
    mockGetServerSession.mockResolvedValue(session('+380672000001', 'editor') as never);
    const noImages = { ...validBody };
    delete (noImages as Record<string, unknown>).images;
    expect((await post(noImages)).status).toBe(400);
    expect((await post({ ...validBody, images: [] })).status).toBe(400);
  });

  it('rejects an invalid status with 400', async () => {
    mockGetServerSession.mockResolvedValue(session('+380672000001', 'editor') as never);
    expect((await post({ ...validBody, status: 'archived' })).status).toBe(400);
  });
});

describe('GET /api/articles (list)', () => {
  it('excludes drafts but includes legacy docs without a status field', async () => {
    await seedArticle();
    await seedArticle({ articleID: 101, title: 'Hidden Draft', status: 'draft' });
    await seedLegacyArticle();

    mockGetServerSession.mockResolvedValue(null as never);
    const res = await listArticles(new NextRequest('http://localhost/api/articles'));
    expect(res.status).toBe(200);

    const body = (await res.json()) as { articles: Array<Record<string, unknown>> };
    const titles = body.articles.map((a) => a.title);
    expect(titles).toContain('Published Story');
    expect(titles).toContain('Legacy Story');
    expect(titles).not.toContain('Hidden Draft');

    // Legacy single-string image is normalized to an array in the response
    const legacyOut = body.articles.find((a) => a.title === 'Legacy Story')!;
    expect(legacyOut.images).toEqual(['https://img.example/legacy-single.jpg']);
    expect(legacyOut.status).toBe('published');

    // PII never leaks into the public list
    expect(JSON.stringify(body)).not.toContain('+380671000002');
  });

  it('ignores includeDrafts for non-editor sessions', async () => {
    await seedArticle({ articleID: 101, title: 'Hidden Draft', status: 'draft' });
    mockGetServerSession.mockResolvedValue(session('+380672000001', 'client') as never);

    const res = await listArticles(new NextRequest('http://localhost/api/articles?includeDrafts=true'));
    const body = (await res.json()) as { articles: Array<Record<string, unknown>> };
    expect(body.articles.map((a) => a.title)).not.toContain('Hidden Draft');
  });

  it('includes drafts for editors and marks the response non-cacheable', async () => {
    await seedArticle();
    await seedArticle({ articleID: 101, title: 'Hidden Draft', status: 'draft' });
    mockGetServerSession.mockResolvedValue(session('+380672000001', 'editor') as never);

    const res = await listArticles(new NextRequest('http://localhost/api/articles?includeDrafts=true'));
    const body = (await res.json()) as { articles: Array<Record<string, unknown>> };
    expect(body.articles.map((a) => a.title)).toContain('Hidden Draft');
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
  });
});

describe('GET /api/articles/[id]', () => {
  function byId(id: string) {
    return getArticleById(
      new NextRequest(`http://localhost/api/articles/${id}`),
      { params: Promise.resolve({ id }) } as never
    );
  }

  it('hides drafts from anonymous and client sessions with a plain 404', async () => {
    const draft = await seedArticle({ articleID: 200, title: 'Secret Draft', status: 'draft' });

    mockGetServerSession.mockResolvedValue(null as never);
    expect((await byId(String(draft._id))).status).toBe(404);

    mockGetServerSession.mockResolvedValue(session('+380672000001', 'client') as never);
    expect((await byId(String(draft._id))).status).toBe(404);
  });

  it('serves drafts to editors/admins with a no-store cache header', async () => {
    const draft = await seedArticle({ articleID: 200, title: 'Secret Draft', status: 'draft' });
    mockGetServerSession.mockResolvedValue(session('+380672000001', 'admin') as never);

    const res = await byId(String(draft._id));
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
    const body = (await res.json()) as { article: Record<string, unknown> };
    expect(body.article.title).toBe('Secret Draft');
  });

  it('serves legacy docs to anyone with normalized images and no creator PII', async () => {
    await seedLegacyArticle();
    mockGetServerSession.mockResolvedValue(null as never);

    const res = await byId('900'); // numeric articleID path
    expect(res.status).toBe(200);
    const body = (await res.json()) as { article: Record<string, unknown> };
    expect(body.article.images).toEqual(['https://img.example/legacy-single.jpg']);
    expect(body.article.status).toBe('published');
    expect(JSON.stringify(body)).not.toContain('+380671000002');
  });

  it('returns 404 for unknown ids', async () => {
    mockGetServerSession.mockResolvedValue(null as never);
    expect((await byId('999999')).status).toBe(404);
  });
});
