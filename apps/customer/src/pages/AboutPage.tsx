import React from 'react';
import { Award, Compass, ShieldCheck, HeartHandshake } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
      {/* Editorial Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-brand-burgundy font-serif italic text-xl">The Story of Chandrakor</span>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-brand-charcoal leading-tight">
          Timeless Saree Elegance for Every Woman
        </h1>
        <div className="w-16 h-0.5 bg-brand-gold mx-auto my-3" />
        <p className="text-sm sm:text-base text-brand-warm-grey leading-relaxed">
          In Maharashtra and Indian culture, the 'Chandrakor'—the graceful crescent moon—symbolizes auspicious beginnings, grace, and festive radiance. At Chandrakor, we bring you an exquisite collection of regular and festive sarees—from royal Paithanis and opulent Banarasis to classic 9-yard Navvaris, dazzling party wear, and effortless daily cottons.
        </p>
      </div>

      {/* Hero Image Showcase */}
      <div className="relative aspect-[16/9] rounded-sm overflow-hidden border border-brand-cream shadow-md">
        <img
          src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=85&w=1600"
          alt="Chandrakor Saree Collections"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-8">
          <p className="text-white font-serif text-lg sm:text-xl italic">
            "A saree is not just an attire—it is an expression of tradition, beauty, and festive joy."
          </p>
        </div>
      </div>

      {/* Brand Values Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-6 bg-white border border-brand-cream/80 rounded-sm space-y-3">
          <div className="w-12 h-12 rounded-full bg-brand-cream/50 flex items-center justify-center text-brand-burgundy">
            <Award className="w-6 h-6 text-brand-gold" />
          </div>
          <h3 className="font-serif text-xl font-bold text-brand-charcoal">Authentic Traditions</h3>
          <p className="text-xs text-brand-warm-grey leading-relaxed">
            From the rich peacock borders of Yeola Paithani to royal Banarasi zari patterns and authentic 9-yard Navvari drapes, our collections celebrate cultural pride.
          </p>
        </div>

        <div className="p-6 bg-white border border-brand-cream/80 rounded-sm space-y-3">
          <div className="w-12 h-12 rounded-full bg-brand-cream/50 flex items-center justify-center text-brand-burgundy">
            <HeartHandshake className="w-6 h-6 text-brand-gold" />
          </div>
          <h3 className="font-serif text-xl font-bold text-brand-charcoal">Everyday & Party Styles</h3>
          <p className="text-xs text-brand-warm-grey leading-relaxed">
            Whether you need a breathable cotton saree for work, a lightweight fancy saree for an evening dinner, or a bridal saree for a wedding, we have you covered.
          </p>
        </div>

        <div className="p-6 bg-white border border-brand-cream/80 rounded-sm space-y-3">
          <div className="w-12 h-12 rounded-full bg-brand-cream/50 flex items-center justify-center text-brand-burgundy">
            <ShieldCheck className="w-6 h-6 text-brand-gold" />
          </div>
          <h3 className="font-serif text-xl font-bold text-brand-charcoal">Quality & Value</h3>
          <p className="text-xs text-brand-warm-grey leading-relaxed">
            Every saree is carefully checked for fabric drape, color brilliance, and finishing, bringing you premium aesthetics at honest, accessible prices.
          </p>
        </div>
      </div>
    </div>
  );
};
