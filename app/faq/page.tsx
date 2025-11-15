export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-12 text-center text-[var(--foreground)]">
        Frequently Asked Questions
      </h1>

      <div className="space-y-8">
        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
          <h2 className="text-2xl font-semibold mb-4 text-[var(--pink-accent)]">
            Where do we source our meat from?
          </h2>
          <p className="text-gray-400 text-lg">
            All of our meat comes from local butchers on Vancouver Island.
          </p>
        </div>

        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
          <h2 className="text-2xl font-semibold mb-4 text-[var(--pink-accent)]">
            What is your refund/return policy?
          </h2>
          <div className="text-gray-400 text-lg space-y-3">
            <p>
              We offer full refunds on all unopened products, whatever the reason.
            </p>
            <p>
              We cannot accept refunds on opened or damaged products, and instead will offer an exchange for products of the same price.
            </p>
            <p>
              To inquire or initiate a refund/exchange, please email us at{' '}
              <a
                href="mailto:maggiestreatsadm@gmail.com"
                className="text-[var(--pink-accent)] hover:text-[var(--pink-accent-dark)] transition-colors"
              >
                maggiestreatsadm@gmail.com
              </a>
            </p>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
          <h2 className="text-2xl font-semibold mb-4 text-[var(--pink-accent)]">
            Who are your treats for?
          </h2>
          <p className="text-gray-400 text-lg">
            Our treats are crafted for your cherished pets, the true stars of the family. As a small family pet treat company, we take pride in delivering top-notch quality with single or limited ingredients only.
          </p>
        </div>
      </div>
    </div>
  );
}

