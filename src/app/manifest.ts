import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AiDareU - Platformnya Para Entrepreneur Indonesia',
    short_name: 'AiDareU',
    description: 'AidareU adalah platformnya para entrepreneur untuk mulai dan scale up bisnis tanpa ribet—mulai dari website profesional, branding, mentoring by Calista AI, hingga manajemen toko lengkap: desain website, manajemen order & customer, optimasi Meta & Google Ads, SEO, Learning Center, serta komunitas bisnis.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#E91E63',
    icons: [
      {
        src: '/icon.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}
