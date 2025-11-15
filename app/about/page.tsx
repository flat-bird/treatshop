export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-12 text-center text-[var(--foreground)]">
        About Maggie&apos;s Treats
      </h1>

      <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800">
        <div className="prose prose-invert max-w-none">
          <p className="text-gray-400 text-lg leading-relaxed mb-4">
            Maggie&apos;s Treats originated from a commitment to providing quality treats for our beloved Maggie and her pawed siblings. Being heavily dissatisfied with the options available at most pet stores, and finding that some treats contained many chemicals and preservatives, we recognized the necessity for a superior alternative.
          </p>
          <p className="text-gray-400 text-lg leading-relaxed mb-4">
            In 2021, we established Maggie&apos;s Treats with the explicit goal of offering accessible, high-quality, limited or single-ingredient pet treats. Our mission is to provide pet owners with treats that prioritize purity and nutritional excellence.
          </p>
          <p className="text-gray-400 text-lg leading-relaxed">
            Welcome to Maggie&apos;s Treats, where the well-being of your pets is our utmost priority.
          </p>
        </div>
      </div>
    </div>
  );
}

