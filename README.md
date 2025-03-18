### Commune Drop Frontend

## Overview

The Commune Drop Frontend is the client-side application for the Commune Drop delivery platform. It provides a user-friendly interface for customers to book deliveries, track orders, and manage their accounts, as well as for carriers to manage their deliveries.

## Features

- User registration and authentication
- Delivery booking with address selection
- Real-time order tracking
- Payment processing
- Order history and management
- Carrier assignment and tracking
- User profile management
- Notifications and alerts


## Technology Stack

- Framework: React.js / Next.js
- State Management: Redux / Context API
- Styling: Tailwind CSS / Styled Components
- Maps: Google Maps / Mapbox
- Real-time Updates: WebSockets / Socket.io
- HTTP Client: Axios / Fetch API
- Form Handling: Formik / React Hook Form


## Backend Integration

The frontend communicates with these backend services:

- Auth Service: For user authentication and profile management
- Order Service: For creating and managing delivery orders
- Location Service: For address selection and order tracking
- Payment Service: For processing payments
- Notification Service: For real-time alerts
- Valuation Service: For delivery price calculation
- Carrier Service: For carrier information and ratings


## Setup

### Prerequisites

- Node.js v16+
- npm or yarn
- Backend services running (or configured API endpoints)


### Quick Start

1. Clone the repository


```shellscript
git clone https://github.com/commune-drop/frontend.git
cd frontend
```

2. Install dependencies


```shellscript
npm install
# or
yarn install
```

3. Configure environment variables


```shellscript
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Start the development server


```shellscript
npm run dev
# or
yarn dev
```

5. Build for production


```shellscript
npm run build
# or
yarn build
```

## Configuration

Key environment variables:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.communedrop.com
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_SOCKET_URL=wss://socket.communedrop.com
```

## Application Structure

- `/pages`: Application routes and pages
- `/components`: Reusable UI components
- `/hooks`: Custom React hooks
- `/store`: State management
- `/services`: API service integrations
- `/utils`: Helper functions and utilities
- `/styles`: Global styles and theme configuration
- `/public`: Static assets


## Key User Flows

- Customer Registration and Onboarding
- Delivery Booking Process
- Real-time Order Tracking
- Payment Processing
- Carrier Assignment and Management
- User Profile and Settings


## Responsive Design

The application is fully responsive and optimized for:

- Desktop browsers
- Tablets
- Mobile devices


## Performance Optimization

- Code splitting and lazy loading
- Image optimization
- Caching strategies
- Server-side rendering for SEO


## License

MIT
