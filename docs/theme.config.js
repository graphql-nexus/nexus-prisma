/* eslint-disable */

export default {
  github: 'https://github.com/prisma/nexus-prisma',
  docsRepositoryBase: 'https://github.com/prisma/nexus-prisma/blob/master',
  branch: 'main', // branch of docs
  path: '/', // path of docs
  titleSuffix: ' – nexus-prisma',
  nextLinks: true,
  prevLinks: true,
  search: true,
  customSearch: null, // customizable, you can use algolia for example
  darkMode: true,
  footer: true,
  footerText: `MIT ${new Date().getFullYear()} © Prisma Data Inc.`,
  footerEditLink: '',
  logo: (
    <>
      <svg>...</svg>
      <span>nexus-prisma</span>
    </>
  ),
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="description" content="nexus-prisma: Official Prisma plugin for Nexus" />
      <meta name="og:title" content="nexus-prisma: Official Prisma plugin for Nexus" />
    </>
  ),
}
