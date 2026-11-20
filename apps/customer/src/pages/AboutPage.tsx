import React from 'react';
import { Award, Compass, ShieldCheck, HeartHandshake } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
      {/* Editorial Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-brand-burgundy font-serif italic text-xl">The Legend of Chandrakor</span>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-brand-charcoal leading-tight">
          Weaving Royal Grace Across Generations
        </h1>
        <div className="w-16 h-0.5 bg-brand-gold mx-auto my-3" />
        <p className="text-sm sm:text-base text-brand-warm-grey leading-relaxed">
          In Maharashtra and ancient Indian heritage, the 'Chandrakor'—the crescent moon—symbolizes divine grace, auspicious beginnings, and timeless beauty. Since 1984, our boutique has preserved the sacred handloom traditions of master weavers across the subcontinent.
        </p>
      </div>

      {/* Hero Image Showcase */}
      <div className="relative aspect-[16/9] rounded-sm overflow-hidden border border-brand-cream shadow-md">
        <img
          src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=85&w=1600"
          alt="Chandrakor Master Weavers Loom"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-8">
          <p className="text-white font-serif text-lg sm:text-xl italic">
            "A genuine handloom saree is not merely manufactured—it is prayed over, spun with devotion, and immortalized."
          </p>
        </div>
      </div>

      {/* Brand Values Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-6 bg-white border border-brand-cream/80 rounded-sm space-y-3">
          <div className="w-12 h-12 rounded-full bg-brand-cream/50 flex items-center justify-center text-brand-burgundy">
            <Award className="w-6 h-6 text-brand-gold" />
          </div>
          <h3 className="font-serif text-xl font-bold text-brand-charcoal">Pure Certified Silks</h3>
          <p className="text-xs text-brand-warm-grey leading-relaxed">
            Every silk saree carries the Silk Mark of India guarantee. We test mulberry and katan fibers to ensure zero synthetic blends or chemical finishes.
          </p>
        </div>

        <div className="p-6 bg-white border border-brand-cream/80 rounded-sm space-y-3">
          <div className="w-12 h-12 rounded-full bg-brand-cream/50 flex items-center justify-center text-brand-burgundy">
            <HeartHandshake className="w-6 h-6 text-brand-gold" />
          </div>
          <h3 className="font-serif text-xl font-bold text-brand-charcoal">Weaver Co-operative Dignity</h3>
          <p className="text-xs text-brand-warm-grey leading-relaxed">
            We work directly with 80+ generational weaver families in Varanasi, Kanchipuram, and Yeola without intermediaries, guaranteeing fair honorariums.
          </p>
        </div>

        <div className="p-6 bg-white border border-brand-cream/80 rounded-sm space-y-3">
          <div className="w-12 h-12 rounded-full bg-brand-cream/50 flex items-center justify-center text-brand-burgundy">
            <ShieldCheck className="w-6 h-6 text-brand-gold" />
          </div>
          <h3 className="font-serif text-xl font-bold text-brand-charcoal">Heirloom Preservation</h3>
          <p className="text-xs text-brand-warm-grey leading-relaxed">
            Woven with authentic gold-silver zari and high twist warp threads that withstand decades of celebrations, becoming treasured family heirlooms.
          </p>
        </div>
      </div>
    </div>
  );
};
