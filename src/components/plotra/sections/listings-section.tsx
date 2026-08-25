import { PropertyCard } from "@/components/plotra/property-card";
import { Reveal } from "@/lib/motion";
import { listings } from "@/lib/plotra-data";

export function ListingsSection({ showAll = false }: { showAll?: boolean }) {
  const feature = listings[0]!;
  const rest = showAll
    ? listings.slice(1)
    : [listings[1]!, listings[2]!, listings[3]!, listings[5]!];

  return (
    <section id="listings" className="bg-background px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <p className="label-eyebrow text-primary">Featured listings</p>
          <h2 className="text-balance-tight mt-4 max-w-2xl font-display text-4xl font-bold text-ink sm:text-6xl">
            Pages buyers actually finish reading.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-6">
          <div className="md:col-span-4">
            <PropertyCard listing={feature} ratio="aspect-[16/10]" />
          </div>
          {rest.map((listing) => (
            <div key={listing.id} className="md:col-span-2">
              <PropertyCard listing={listing} ratio="aspect-[4/5]" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
