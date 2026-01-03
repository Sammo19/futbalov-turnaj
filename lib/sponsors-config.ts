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
    name: 'ZFD',
    image: 'Logo_ZFD.jpg',
  },
  {
    type: 'image',
    name: 'Erb',
    image: 'erb.svg',
  },
  {
    type: 'image',
    name: 'Sponsor',
    image: '310170900_507642644702219_7548674265634692107_n.png',
  },
  {
    type: 'image',
    name: 'Sponsor',
    image: 'Snímka obrazovky 2026-01-03 o 8.22.55.png',
  },
  {
    type: 'text',
    name: 'Lukáš Skovajsa',
    text: 'Lukáš Skovajsa - servis plyn',
  },
];
