// Floating WhatsApp chat button — sits fixed on the left side of the screen.
// ⚠️  BEFORE GOING LIVE: Replace PHONE_NUMBER with your real WhatsApp Business
//     number (country code + number, no +, no spaces, no dashes).
//     Example India number: 919876543210  (91 = country code, then 10-digit mobile)
const PHONE_NUMBER = '911234567890'; // TODO: replace with your real WhatsApp Business number
const DEFAULT_MESSAGE = 'Hi! I have a question about a product on Sheen Bazaar.';

export default function WhatsAppButton() {
  const link = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-fab"
      aria-label="Chat with us on WhatsApp"
      title="Chat with us on WhatsApp"
    >
      <span className="whatsapp-fab-ping" />
      <svg viewBox="0 0 32 32" width="30" height="30" fill="#fff" aria-hidden="true">
        <path d="M16.02 3C9.4 3 4.02 8.38 4.02 15c0 2.29.63 4.44 1.73 6.28L3 29l7.9-2.66A11.9 11.9 0 0 0 16.02 27C22.63 27 28 21.62 28 15S22.63 3 16.02 3Zm0 21.6c-1.9 0-3.68-.51-5.2-1.4l-.37-.22-4.7 1.58 1.55-4.58-.24-.38A9.55 9.55 0 0 1 5.86 15c0-5.6 4.56-10.14 10.16-10.14 5.6 0 10.14 4.55 10.14 10.14 0 5.6-4.55 10.6-10.14 10.6Zm5.55-7.6c-.3-.15-1.78-.88-2.06-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.96 1.18-.18.2-.35.22-.65.08-.3-.15-1.28-.47-2.44-1.5-.9-.8-1.51-1.8-1.69-2.1-.18-.3-.02-.46.13-.61.14-.14.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.64-.93-2.24-.24-.58-.5-.5-.68-.51h-.58c-.2 0-.53.08-.8.38-.28.3-1.05 1.03-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.13 3.25 5.17 4.56.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.78-.73 2.03-1.43.25-.7.25-1.3.18-1.43-.08-.13-.28-.2-.58-.35Z"/>
      </svg>
    </a>
  );
}
