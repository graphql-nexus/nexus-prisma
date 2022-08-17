/* eslint-disable */

import { NexusPrismaIcon } from './components/logos/NexusPrisma'

export default {
  github: 'https://github.com/prisma/nexus-prisma',
  projectLink: 'https://github.com/prisma/nexus-prisma',
  docsRepositoryBase: 'https://github.com/prisma/nexus-prisma/blob/main/docs/pages',
  titleSuffix: ' | Nexus Prisma',
  search: true,
  floatTOC: true,
  feedbackLink: 'Question? Give us feedback →',
  footerText: `MIT ${new Date().getFullYear()} © Prisma Data Inc.`,
  banner: function Banner() {
    return (
      <a
        href="https://github.com/graphql-nexus/nexus-plugin-prisma/issues/1039"
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-current no-underline"
        title="Go to the GitHub issue"
      >
        ⚠️ Currently in early preview - not to be used in production! Follow progress →
      </a>
    )
  },
  logo: function Logo() {
    return (
      <div className="flex items-center justify-center">
        <NexusPrismaIcon width="4em" height="4em" />
        <div className="ml-2">Nexus Prisma</div>
      </div>
    )
  },
  head: function Head({ title, description }) {
    return (
      <>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content={description} />
        <meta property="og:type" content="website" />
        <meta name="og:title" content={title} />
        <meta name="og:description" content={description} />
        <meta property="og:locale" content="en_US" />
        <meta property="og:site_name" content="Prisma Nexus" />
      </>
    )
  },
  footerEditLink: () => {
    return 'Edit this page on GitHub'
  },
  i18n: [{ locale: 'en', text: 'English' }],
  gitTimestamp: 'Last updated on',
}
