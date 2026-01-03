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
  // Example sponsors - replace with your actual sponsors
  // {
  //   type: 'image',
  //   name: 'Sponsor 1',
  //   image: 'sponsor1.png',
  //   link: 'https://example.com'
  // },
  // {
  //   type: 'text',
  //   name: 'Sponsor 2',
  //   text: 'SPONSOR TEXT',
  // },
];
