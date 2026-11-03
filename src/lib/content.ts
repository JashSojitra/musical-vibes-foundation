import { site } from '@/data/site';
/** Frontend content boundary. A future CMS adapter returns this same shape. */
export async function getHomeContent() { return site; }
export type HomeContent = Awaited<ReturnType<typeof getHomeContent>>;
