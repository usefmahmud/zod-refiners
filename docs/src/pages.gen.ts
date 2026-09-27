// deno-fmt-ignore-file
// biome-ignore format: generated types do not need formatting
// prettier-ignore
import type { PathsForPages } from 'waku/router'

// prettier-ignore
type Page =
  | { path: '/cli'; render: 'static' }
  | { path: '/configuration'; render: 'static' }
  | { path: '/faq'; render: 'static' }
  | { path: '/getting-started'; render: 'static' }
  | { path: '/'; render: 'static' }
  | { path: '/refiners/allowed-domains'; render: 'static' }
  | { path: '/refiners/date-range'; render: 'static' }
  | { path: '/refiners'; render: 'static' }
  | { path: '/refiners/password-match'; render: 'static' }
  | { path: '/refiners/strong-password'; render: 'static' }
  | { path: '/refiners/types'; render: 'static' }

// prettier-ignore
declare module 'waku/router' {
  interface RouteConfig {
    paths: PathsForPages<Page>
  }
  interface CreatePagesConfig {
    pages: Page
  }
}
