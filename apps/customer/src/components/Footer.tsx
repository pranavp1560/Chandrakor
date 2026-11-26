import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, RefreshCw, Award, Mail, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#1E1C19] text-[#EDE8DF] border-t border-brand-charcoal pt-12 sm:pt-16 pb-10 w-full max-w-full overflow-hidden">
      {/* Trust Highlights Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12 mb-8 sm:mb-12 border-b border-[#36322D]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-full bg-brand-burgundy/40 border border-brand-gold/30 flex items-center justify-center text-brand-gold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif text-base font-semibold text-white">Silk Mark Certified</h4>
              <p className="text-xs text-brand-warm-grey">100% Pure Mulberry & Katan</p>
            </div>
          </div>

          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-full bg-brand-burgundy/40 border border-brand-gold/30 flex items-center justify-center text-brand-gold">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif text-base font-semibold text-white">Insured Pan-India</h4>
              <p className="text-xs text-brand-warm-grey">Complimentary express shipping</p>
            </div>
          </div>

          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-full bg-brand-burgundy/40 border border-brand-gold/30 flex items-center justify-center text-brand-gold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif text-base font-semibold text-white">Quality Assurance</h4>
              <p className="text-xs text-brand-warm-grey">Finest fabrics & traditional designs</p>
            </div>
          </div>

          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-full bg-brand-burgundy/40 border border-brand-gold/30 flex items-center justify-center text-brand-gold">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif text-base font-semibold text-white">Satisfaction Guarantee</h4>
              <p className="text-xs text-brand-warm-grey">Easy exchanges & secure delivery</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-[#36322D]">
        {/* Brand Col */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-brand-gold font-serif text-xl font-bold">☾</span>
            <span className="font-serif text-2xl tracking-[0.2em] text-white font-bold uppercase">
              CHANDRAKOR
            </span>
          </div>
          <p className="text-xs text-[#B5AFA6] leading-relaxed max-w-sm">
            Your premier destination for stunning Indian sarees. From traditional Maharashtrian Paithanis and iconic 9-yard Navvaris to opulent Banarasis, glamorous party wear, and comfortable daily drapes, Chandrakor brings grace to every celebration.
          </p>
          <div className="pt-2 text-xs text-brand-gold-light space-y-1">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-brand-gold shrink-0" />
              <span>108 Heritage Boulevard, Kala Ghoda, Mumbai 400001</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-brand-gold shrink-0" />
              <span>+91 98200 12345 (Mon–Sat, 10am–7pm IST)</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-brand-gold shrink-0" />
              <span>curations@chandrakor.com</span>
            </div>
          </div>
        </div>

        {/* Collections Col */}
        <div>
          <h4 className="font-serif text-sm tracking-wider uppercase font-semibold text-white mb-4">
            Popular Categories
          </h4>
          <ul className="space-y-2.5 text-xs text-[#B5AFA6]">
            <li>
              <Link to="/shop?category=paithani" className="hover:text-brand-gold transition-colors">
                Paithani Sarees
              </Link>
            </li>
            <li>
              <Link to="/shop?category=banarasi-silk" className="hover:text-brand-gold transition-colors">
                Banarasi Sarees
              </Link>
            </li>
            <li>
              <Link to="/shop?category=navvari-sarees" className="hover:text-brand-gold transition-colors">
                Traditional Navvari
              </Link>
            </li>
            <li>
              <Link to="/shop?category=party-wear" className="hover:text-brand-gold transition-colors">
                Party Wear & Designer
              </Link>
            </li>
            <li>
              <Link to="/shop?category=silk-sarees" className="hover:text-brand-gold transition-colors">
                Wedding Silk Sarees
              </Link>
            </li>
            <li>
              <Link to="/shop?category=cotton-sarees" className="hover:text-brand-gold transition-colors">
                Cotton & Regular Sarees
              </Link>
            </li>
          </ul>
        </div>

        {/* Curation Categories Col */}
        <div>
          <h4 className="font-serif text-sm tracking-wider uppercase font-semibold text-white mb-4">
            Curations
          </h4>
          <ul className="space-y-2.5 text-xs text-[#B5AFA6]">
            <li>
              <Link to="/shop?collection=wedding-collection" className="hover:text-brand-gold transition-colors">
                Bridal & Trousseau
              </Link>
            </li>
            <li>
              <Link to="/shop?collection=new-arrivals" className="hover:text-brand-gold transition-colors">
                New Arrivals
              </Link>
            </li>
            <li>
              <Link to="/shop?collection=best-sellers" className="hover:text-brand-gold transition-colors">
                Cherished Best Sellers
              </Link>
            </li>
            <li>
              <Link to="/shop?collection=festive-collection" className="hover:text-brand-gold transition-colors">
                Diwali & Festive Weaves
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-brand-gold transition-colors">
                About Chandrakor
              </Link>
            </li>
          </ul>
        </div>

        {/* Customer Care Col */}
        <div>
          <h4 className="font-serif text-sm tracking-wider uppercase font-semibold text-white mb-4">
            Customer Services
          </h4>
          <ul className="space-y-2.5 text-xs text-[#B5AFA6]">
            <li>
              <span className="text-[#8E8880]">Blouse Stitching Assistance</span>
            </li>
            <li>
              <span className="text-[#8E8880]">Authentic Quality Check</span>
            </li>
            <li>
              <span className="text-[#8E8880]">Express Pan-India Delivery</span>
            </li>
            <li>
              <span className="text-[#8E8880]">Easy 7-Day Exchange</span>
            </li>
            <li>
              <a href="http://localhost:5174" target="_blank" rel="noopener noreferrer" className="text-brand-gold hover:underline">
                Staff Administration Portal ↗
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#8E8880]">
        <p>© {new Date().getFullYear()} Chandrakor Saree Elegance. All rights reserved.</p>
        <p className="mt-2 sm:mt-0 font-serif italic text-brand-gold-light/80">
          Celebrating Traditional & Modern Saree Elegance
        </p>
      </div>
    </footer>
  );
};
