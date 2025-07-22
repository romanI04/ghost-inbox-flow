# Inghost - AI Email Assistant

A modern, minimal front-end for an automation-first email assistant that handles Gmail inbox triage with AI-powered categorization, draft generation, and smart notifications.

## Features

- **Modern UI**: Clean, responsive design with dark/light mode support
- **AI-Powered Triage**: Intelligent email categorization and prioritization  
- **Smart Automation**: Auto-replies, draft generation, and digest creation
- **Google OAuth**: Secure authentication with Gmail API access
- **Real-time Dashboard**: Monitor auto-sent emails, pending drafts, and digests
- **Customizable Settings**: Tone control, risk thresholds, and notification preferences

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui component library
- **Routing**: React Router DOM
- **Authentication**: Supabase (Google OAuth 2.0)
- **State Management**: React hooks with local state
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (for authentication)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd inghost-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env.local file (if using real Supabase integration)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:8080](http://localhost:8080) in your browser

## Project Structure

```
src/
├── components/
│   ├── navigation/
│   │   └── Navigation.tsx      # Top navigation bar
│   └── ui/                     # shadcn/ui components
├── pages/
│   ├── Login.tsx              # Google OAuth login page
│   ├── Dashboard.tsx          # Main dashboard with email sections
│   └── Settings.tsx           # Configuration and preferences
├── hooks/
│   └── use-toast.ts           # Toast notification hook
├── lib/
│   └── utils.ts               # Utility functions
├── App.tsx                    # Main app with routing and auth
├── main.tsx                   # App entry point
└── index.css                  # Global styles and design system
```

## Key Components

### Login Page
- Google OAuth integration with Supabase
- Professional landing page with feature highlights
- Responsive design with glass-morphism effects

### Dashboard
- **Auto-Sent**: View AI-generated replies that were automatically sent
- **Pending Drafts**: Review and edit AI-generated drafts before sending
- **Digests**: Summarized email bundles with key insights

### Settings
- **Tone Controls**: Adjust formality, emoji usage, and brevity
- **Risk Thresholds**: Configure automation confidence levels  
- **Notifications**: Manage alerts and digest scheduling
- **Billing**: Subscription management (placeholder)

## Design System

The app uses a comprehensive design system defined in `src/index.css` and `tailwind.config.ts`:

- **Colors**: HSL-based semantic tokens for consistent theming
- **Typography**: Clean sans-serif with gradient text effects
- **Components**: Glass-morphism cards with subtle animations
- **Responsive**: Mobile-first design with breakpoint considerations

### Key Design Tokens

```css
/* Primary brand colors */
--primary: 223 83% 33%        /* Professional blue */
--accent: 250 65% 55%         /* Purple highlights */
--success: 142 76% 36%        /* Success green */
--warning: 38 92% 50%         /* Warning amber */
```

## API Integration Points

The frontend includes placeholder API calls that need to be connected to your backend:

### Dashboard APIs
- `GET /api/auto-sent` - Fetch auto-sent emails
- `GET /api/pending-drafts` - Fetch pending drafts
- `GET /api/digests` - Fetch email digests
- `POST /api/send-draft` - Send approved draft
- `POST /api/reject-draft` - Reject/archive draft

### Settings APIs
- `GET /api/settings/tone` - Get tone preferences
- `POST /api/update-tone` - Save tone settings
- `GET /api/settings/thresholds` - Get risk thresholds
- `POST /api/update-thresholds` - Save threshold settings
- `POST /api/update-schedule` - Save notification schedule

### Authentication
- Configure Supabase Google OAuth with `gmail.modify` scope
- Update authentication logic in `src/App.tsx`

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Adding New Features

1. **New Pages**: Add to `src/pages/` and update routing in `App.tsx`
2. **Components**: Use shadcn/ui patterns and design system tokens
3. **API Calls**: Replace placeholder fetch calls with real endpoints
4. **Styling**: Extend design system in `index.css` and `tailwind.config.ts`

## Deployment

The app is ready for deployment to any static hosting service:

- **Vercel**: Connect GitHub repo for automatic deployments
- **Netlify**: Drag and drop build folder or connect repository  
- **Cloudflare Pages**: Connect GitHub for automatic deployments

Make sure to set environment variables for Supabase in your hosting platform.

## Supabase Integration

To enable real authentication and backend functionality:

1. Create a Supabase project
2. Enable Google OAuth provider in Authentication settings
3. Configure OAuth redirect URLs
4. Add Gmail API scope: `https://www.googleapis.com/auth/gmail.modify`
5. Update environment variables with your Supabase credentials

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the design system
4. Test thoroughly across devices
5. Submit a pull request

## License

MIT License - see LICENSE file for details