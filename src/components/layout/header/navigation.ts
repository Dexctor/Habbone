export type NavEntry = {
  label: string
  href?: string
  external?: boolean
  children?: NavEntry[]
  prefetch?: boolean
}

export const navigation: NavEntry[] = [
  { label: 'Home', href: '/' },
  {
    label: 'HabbOne',
    children: [
      { label: 'Equipe', href: '/team' },
      { label: 'Boutique', href: '/boutique' },
      { label: 'Tous les articles', href: '/news' },
      { label: 'Partenaires', href: '/partenaires' },
      { label: 'Contact', href: '/contact'},
    ],
  },
  {
    label: 'Habbo',
    children: [
      { label: 'Habbo Attitude', href: 'https://www.habbo.fr/playing-habbo/habbo-way', external: true },
      { label: 'Service Client', href: 'https://help.habbo.fr/hc/fr', external: true },
      { label: 'Boutique', href: 'https://www.habbo.fr/shop', external: true },
    ],
  },
  {
    label: 'Extras',
    children: [
      { label: "Generateur d'avatar", href: '/imager', prefetch: false },
      { label: 'Changements de pseudo Habbo', href: '/pseudohabbo', prefetch: false },
    ],
  },
  { label: 'Forum', href: '/forum' },
]
