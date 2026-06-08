import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DIST_DIR = path.resolve(__dirname, '../dist')

// Define SEO metadata for each page
const pages = {
  home: {
    route: '',
    title: 'GPA-Cal | Simple & Modern GPA Calculator',
    description: 'Calculate your semester and cumulative GPA easily with GPA-Cal. A simple, modern, and beautiful GPA calculator designed for university students to track, plan, and optimize their academic records.',
    robots: 'index, follow',
    canonical: 'https://www.gpacal.app/',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'GPA-Cal',
      'url': 'https://www.gpacal.app/',
      'description': 'A simple, modern, and beautiful GPA calculator designed for university students to track and calculate GPA.',
      'applicationCategory': 'EducationalApplication',
      'operatingSystem': 'All',
    },
  },
  addGrades: {
    route: 'addGrades',
    title: 'Calculate GPA & Semester Grades | GPA-Cal',
    description: 'Enter your course grades, credits, and semesters to calculate your GPA. Keep track of your academic performance with our interactive charts.',
    robots: 'index, follow',
    canonical: 'https://www.gpacal.app/addGrades',
  },
  customDegree: {
    route: 'custom-degree',
    title: 'Custom Degree GPA Planner | GPA-Cal',
    description: 'Plan and manage your custom degree path. Add subjects, credits, and grade targets to estimate and predict your cumulative GPA.',
    robots: 'index, follow',
    canonical: 'https://www.gpacal.app/custom-degree',
  },
  login: {
    route: 'login',
    title: 'Sign In | GPA-Cal',
    description: 'Log in to GPA-Cal to sync your GPA data to the cloud, access interactive charts, and track your academic progress across all devices.',
    robots: 'noindex, nofollow',
    canonical: 'https://www.gpacal.app/login',
  },
  moderation: {
    route: 'admin/moderation',
    title: 'Admin Moderation | GPA-Cal',
    description: 'GPA-Cal admin control panel.',
    robots: 'noindex, nofollow',
    canonical: 'https://www.gpacal.app/admin/moderation',
  },
}

function injectMeta(html, metadata) {
  let modifiedHtml = html

  // 1. Replace or insert Title
  const titleTag = `<title>${metadata.title}</title>`
  if (modifiedHtml.includes('<title>')) {
    modifiedHtml = modifiedHtml.replace(/<title>.*?<\/title>/, titleTag)
  } else {
    modifiedHtml = modifiedHtml.replace('</head>', `  ${titleTag}\n  </head>`)
  }

  // 2. Prepare meta tags
  const metaTags = `
    <!-- General SEO -->
    <meta name="description" content="${metadata.description}" />
    <meta name="robots" content="${metadata.robots}" />
    <link rel="canonical" href="${metadata.canonical}" />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${metadata.canonical}" />
    <meta property="og:title" content="${metadata.title}" />
    <meta property="og:description" content="${metadata.description}" />
    <meta property="og:image" content="https://www.gpacal.app/og-image.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${metadata.canonical}" />
    <meta name="twitter:title" content="${metadata.title}" />
    <meta name="twitter:description" content="${metadata.description}" />
    <meta name="twitter:image" content="https://www.gpacal.app/og-image.png" />
  `

  // 3. Prepare Schema markup if exists
  let schemaTag = ''
  if (metadata.schema) {
    schemaTag = `\n    <script type="application/ld+json">\n    ${JSON.stringify(metadata.schema, null, 2)}\n    </script>`
  }

  // Inject before </head>
  return modifiedHtml.replace('</head>', `${metaTags}${schemaTag}\n  </head>`)
}

async function run() {
  const indexPath = path.join(DIST_DIR, 'index.html')
  if (!fs.existsSync(indexPath)) {
    console.error('Error: Build files not found in dist/. Please run npm run build first.')
    process.exit(1)
  }

  const baseHtml = fs.readFileSync(indexPath, 'utf-8')

  for (const [key, value] of Object.entries(pages)) {
    const pageHtml = injectMeta(baseHtml, value)

    if (value.route === '') {
      // Home page: overwrite main index.html in dist/
      fs.writeFileSync(indexPath, pageHtml, 'utf-8')
      console.log('✓ Prerendered home page (dist/index.html)')
    } else {
      // Subpage: create directory and save index.html there
      const targetDir = path.join(DIST_DIR, value.route)
      fs.mkdirSync(targetDir, { recursive: true })
      fs.writeFileSync(path.join(targetDir, 'index.html'), pageHtml, 'utf-8')
      console.log(`✓ Prerendered ${value.route} page (dist/${value.route}/index.html)`)
    }
  }

  console.log('\nSEO metadata injection completed successfully!')
}

run().catch(console.error)
