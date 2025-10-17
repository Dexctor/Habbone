'use client'

import { motion } from 'framer-motion'
import React from 'react'

type BannerProps = {
  slow: any
}

export default function Banner({ slow }: BannerProps) {
  return (
    <motion.section
      layout
      className="bg flex items-center justify-center w-full min-h-[400px] bg-[#272746]"
      style={{ backgroundImage: "url('')" }}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={slow as any}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="https://habbone.fr/assets/img/logo.png" alt="" />
    </motion.section>
  )
}

