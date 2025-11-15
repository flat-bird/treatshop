import Image from 'next/image';

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-center text-[var(--foreground)]">
        Contact Us
      </h1>

      <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800 mb-8">
        <p className="text-xl text-gray-400 text-center leading-relaxed">
          We are here to help if needed! Call or text us at{' '}
          <a
            href="tel:7805100040"
            className="text-[var(--pink-accent)] hover:text-[var(--pink-accent-dark)] transition-colors font-semibold"
          >
            780-510-0040
          </a>
          {' '}and we&apos;ll get back to you as soon as we can!
        </p>
      </div>

      <div className="relative w-full h-96 rounded-lg overflow-hidden">
        <Image
          src="/dawg.webp"
          alt="Maggie's Treats"
          fill
          className="object-cover rounded-lg"
          sizes="(max-width: 1024px) 100vw, 100vw"
          priority
        />
      </div>
    </div>
  );
}

