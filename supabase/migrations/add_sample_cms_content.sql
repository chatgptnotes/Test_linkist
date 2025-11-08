-- Add sample content to cms_pages table
-- This provides initial data for testing the admin content management page

-- Insert sample pages
INSERT INTO cms_pages (title, slug, content, status, meta_title, meta_description, published_at)
VALUES
    (
        'About Linkist NFC Technology',
        'about-linkist-nfc',
        'Linkist NFC is a revolutionary technology that allows you to share your contact information, social media profiles, and more with just a tap of your NFC-enabled business card. Our cutting-edge technology makes networking seamless and professional.',
        'published',
        'About Our NFC Technology | Linkist',
        'Learn about Linkist NFC technology and how it revolutionizes business networking.',
        NOW()
    ),
    (
        'How to Set Up Your NFC Card',
        'setup-nfc-card',
        'Setting up your Linkist NFC card is simple:

1. Visit your profile builder page
2. Enter your contact information
3. Add your social media links
4. Customize your profile design
5. Tap your card to any phone to share!

Your card is ready to use immediately after setup.',
        'published',
        'NFC Card Setup Guide | Linkist',
        'Step-by-step guide to configure your new Linkist NFC business card.',
        NOW()
    ),
    (
        'Premium Card Collection 2024',
        'premium-cards-2024',
        'Introducing our new premium collection for 2024!

Features:
- Premium metal materials
- Custom designs
- Enhanced durability
- Elegant finishes (Gold, Silver, Rose Gold, Black)
- Lifetime warranty

Contact us for bulk orders and custom branding options.',
        'draft',
        'Premium NFC Cards 2024 | Linkist',
        'Introducing our new premium collection with advanced materials and designs.',
        NULL
    ),
    (
        'Terms of Service',
        'terms-of-service',
        'Terms and Conditions for Linkist NFC Services

Last Updated: January 2024

1. Acceptance of Terms
By using Linkist NFC services, you agree to these terms and conditions.

2. Service Description
Linkist provides NFC business card technology and related services.

3. User Responsibilities
Users are responsible for maintaining accurate profile information.

4. Privacy
We respect your privacy and protect your personal information.

5. Limitations
Services are provided "as is" without warranties.

For complete terms, contact legal@linkist.com',
        'published',
        'Terms of Service | Linkist NFC',
        'Terms and conditions for using Linkist NFC services.',
        NOW()
    ),
    (
        'NFC Card Demo Video',
        'nfc-card-demo-video',
        'Watch our demonstration video to see how easy it is to share your contact information with a simple tap of your Linkist NFC card.

Video Highlights:
- Tap your card to any NFC-enabled smartphone
- Instantly share your complete digital profile
- Works on both iOS and Android devices
- No app download required for recipients
- Professional networking made simple

Perfect for business meetings, conferences, networking events, and everyday professional encounters.',
        'published',
        'NFC Card Demo Video | Linkist',
        'Watch how easy it is to share your contact information with a simple tap.',
        NOW()
    )
ON CONFLICT (slug) DO NOTHING;
