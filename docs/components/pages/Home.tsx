import Link from 'next/link'
import React, { FC } from 'react'
import { NexusPrismaIcon } from '../logos/NexusPrisma'

export const Home: FC = () => (
  <div className="w-auto px-4 py-16 mx-auto sm:py-24 lg:px-8">
    <div className="flex justify-center pb-8">
      <NexusPrismaIcon width="30em" height="10em" />
    </div>

    <h1 className="max-w-5xl text-center mx-auto text-6xl font-extrabold tracking-tighter leading-[1.1] sm:text-7xl lg:text-8xl xl:text-8xl">
      <span className="inline-block text-transparent bg-clip-text bg-nextraBlue">Prisma&nbsp;</span>
      <br />
      plugin for&nbsp;
      <span className="inline-block text-transparent bg-clip-text bg-nextraBlue">Nexus</span>
    </h1>

    <p className="max-w-lg mx-auto pt-8 text-xl font-medium leading-tight text-center text-gray-400 sm:max-w-4xl sm:text-2xl md:text-3xl lg:text-4xl">
      This plugin integrates Prisma into Nexus. It gives you an API you to project fields from models defined
      in your Prisma schema into your GraphQL API. It also gives you an API to build GraphQL root fields that
      allow your API clients to query and mutate data.
    </p>
    <div className="max-w-xl mx-auto pt-8 sm:flex sm:justify-center md:mt-8">
      <div className="rounded-md">
        <Link href="/docs">
          <a className="flex items-center justify-center w-full px-8 py-3 text-base font-medium text-white no-underline bg-black border border-transparent rounded-md dark:bg-white dark:text-black dark:hover:bg-gray-300 hover:bg-gray-700 md:py-3 md:text-lg md:px-10 md:leading-6">
            Start Building →
          </a>
        </Link>
      </div>
    </div>
  </div>
)
