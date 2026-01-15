# Design Guidelines: Clean Minimalist Application

## Design Approach
**Reference-Based**: Drawing inspiration from Apple's minimalist aesthetic combined with Airbnb's approachable warmth. Emphasis on generous whitespace, crisp typography, and subtle depth through shadows rather than borders.

## Core Design Elements

### Typography
- **Primary Font**: Inter (Google Fonts) for all text
- **Headings**: 
  - H1: 56px/64px, font-weight 700, tracking -0.02em
  - H2: 40px/48px, font-weight 700
  - H3: 28px/36px, font-weight 600
- **Body**: 16px/28px, font-weight 400
- **Small Text**: 14px/22px, font-weight 400
- **Text Colors**: #111111 (headings), #333333 (body), #666666 (secondary)

### Layout System
- **Container**: max-w-7xl centered with px-6 lg:px-8
- **Spacing Scale**: Exclusively use units of 4, 6, 8, 12, 16, 20, 24, 32
- **Section Padding**: py-16 lg:py-24
- **Card Spacing**: gap-6 lg:gap-8
- **Background**: #FFFFFF (primary), #F9FAFB (subtle sections)

### Component Library

**Navigation**
- Fixed header with backdrop-blur effect, white background with subtle shadow on scroll
- Horizontal layout with logo left, nav center, CTA right
- 60px height, clean sans-serif links with 400 weight

**Hero Section**
- Full-width image background (aspect-ratio 16/9 on mobile, full viewport height on desktop)
- White text with large hero headline (72px/80px)
- CTA buttons with backdrop-blur-md, white background at 20% opacity
- Subtle gradient overlay on image (black 40% opacity from bottom)

**Cards**
- White background, rounded-2xl corners
- Single subtle shadow: 0 1px 3px rgba(0,0,0,0.08)
- Padding: p-6 lg:p-8
- Hover state: Lift with shadow: 0 4px 12px rgba(0,0,0,0.12)

**Buttons**
- Primary: #111111 background, white text, rounded-xl, px-6 py-3, font-weight 500
- Secondary: white background, #111111 border (1px), #111111 text
- On Images: backdrop-blur-md, white/10 background, white text, white/20 border

**Forms**
- Input fields: white background, #E5E7EB border, rounded-lg, p-3
- Focus state: #111111 border, subtle shadow
- Labels: #374151, 14px, font-weight 500, mb-2

**Grid Layouts**
- Features: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Testimonials: grid-cols-1 lg:grid-cols-2
- Always single column on mobile

## Page Structure

**Landing Page Sections** (in order):
1. Hero with large image and centered headline/CTA
2. Features grid (3 columns) with icons and descriptions
3. Product showcase with alternating image-text layouts (2 sections)
4. Social proof section (2-column testimonials)
5. Stats bar with 4 metrics in single row
6. Final CTA with background image
7. Footer with 4-column layout (About, Product, Resources, Contact)

## Images

**Hero Image**
- Placement: Full-width background, top of page
- Description: Bright, airy lifestyle photography showing the product in use, natural lighting, clean composition
- Treatment: 16/9 aspect ratio on mobile, full viewport on desktop, dark gradient overlay bottom 40%

**Product Showcase Images**
- Placement: Alternating left/right in content sections
- Description: Clean product photography on white background, high resolution, consistent lighting
- Treatment: Rounded-2xl corners, subtle shadow, 50% width on desktop

**CTA Section Image**
- Placement: Full-width background before footer
- Description: Inspirational scene related to product benefit, warm tones, inviting
- Treatment: 400px height, gradient overlay for text contrast

## Visual Hierarchy
- Generous whitespace drives focus (minimum 80px between major sections)
- Text contrast ensures readability (WCAG AAA compliance)
- Subtle shadows create depth without visual noise
- Single accent moments (images, primary CTAs) per viewport