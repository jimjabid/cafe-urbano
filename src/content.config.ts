import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Every field here is Decap-editable; keep public/admin/config.yml in sync.
// Category accent dots map to --color-dot-* tokens in src/styles/global.css.
export const DOT_COLORS = ['pink', 'green', 'peach', 'olive', 'mint', 'yellow', 'purple', 'lime', 'teal', 'coral'] as const;
export const PLACEHOLDERS = ['infusiones', 'bakery', 'salados'] as const;

const settings = defineCollection({
  loader: glob({ pattern: 'settings.yaml', base: './src/content/site' }),
  schema: z.object({
    businessName: z.string(),
    tagline: z.string(),
    greeting: z.string(), // header speech bubble — comes from the printed menu
    // NAP — must match the visible page AND the JSON-LD exactly
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    email: z.string().optional(),
    address: z.object({
      street: z.string(),
      locality: z.string(),
      region: z.string(),
      postalCode: z.string(),
      country: z.string().default('AR'),
    }),
    geo: z.object({ latitude: z.number(), longitude: z.number() }).optional(),
    mapsUrl: z.string().url().optional(),
    hours: z.array(
      z.object({
        days: z.string(),
        opens: z.string(),
        closes: z.string(),
      })
    ),
    priceRange: z.string().optional(),
    socials: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
    schemaType: z.string().default('CafeOrCoffeeShop'),
    seo: z.object({
      titleSuffix: z.string(),
      description: z.string().max(160),
      ogImage: z.string().optional(),
    }),
  }),
});

// Menu structure — one YAML per category; section + filter-pill order via `order`.
const categories = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/categories' }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
    dot: z.enum(DOT_COLORS),
    placeholder: z.enum(PLACEHOLDERS).default('bakery'),
    note: z.string().optional(), // e.g. "Podés pedirlos de 12 a 15:30 hs."
  }),
});

// One markdown file per menu item. `available: false` hides it without deleting.
const dishes = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/dishes' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      variant: z.string().optional(), // "mediano" / "grande" / "extra" — italic after the name; "extra" rows show +price
      price: z.number(), // plain ARS number, rendered as printed ("3000")
      category: z.string(), // must match a categories/ filename
      description: z.string().optional(),
      image: image().optional(), // real photo; rows without one use the category line-art placeholder
      order: z.number().default(0),
      available: z.boolean().default(true),
    }),
});

// Editable promo banners injected between menu categories.
const promos = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/promos' }),
  schema: z.object({
    text: z.string(),
    afterCategory: z.string(), // categories/ filename the banner renders after
    order: z.number().default(0),
    enabled: z.boolean().default(true),
  }),
});

export const collections = { settings, categories, dishes, promos };
