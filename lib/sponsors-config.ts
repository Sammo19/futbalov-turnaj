export type Sponsor = {
  type: 'image' | 'text';
  name: string;
  image?: string;  // filename in /public/sponsors/
  text?: string;   // text to display if no image
  link?: string;   // optional website link
};

// Configure your sponsors here
// For images: place them in /public/sponsors/ folder
// For text-only: just set text property
export const sponsors: Sponsor[] = [
  {
    type: 'image',
    name: 'ZIPSER FRUIT DISTILLERY',
    image: 'Logo_ZFD.jpg',
    text: 'ZIPSER FRUIT DISTILLERY',
  },
  {
    type: 'image',
    name: 'Obec Bijacovce',
    image: 'erb.svg',
    text: 'Obec Bijacovce',
  },
  {
    type: 'image',
    name: 'GP thermont s.r.o.',
    image: '310170900_507642644702219_7548674265634692107_n.png',
    text: 'GP thermont s.r.o.',
  },
  {
    type: 'image',
    name: 'PETER TRANSPORTE',
    image: 'Snímka obrazovky 2026-01-03 o 8.22.55.png',
    text: 'PETER TRANSPORTE',
  },
  {
    type: 'image',
    name: 'Luckafé',
    image: 'luckafe.png',
    text: 'Luckafé',
  },
  {
    type: 'text',
    name: 'Lukáš Skovajsa',
    text: 'Lukáš Skovajsa - servis plyn',
  },
];
