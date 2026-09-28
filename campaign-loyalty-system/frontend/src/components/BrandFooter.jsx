import marathonLogo from '../assets/Marathon logo.png';

function BrandFooter({ className = '' }) {
  return (
    <footer className={`w-full bg-black text-white ${className ? className : 'mt-16 border-t border-zinc-800'}`}>
      <div className="max-w-5xl mx-auto px-6 sm:px-10 py-10 sm:py-12 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Left Column: Brand Logo */}
        <div className="flex flex-col items-start">
          <img
            src={marathonLogo}
            alt="Marathon Spirits"
            className="h-16 w-auto object-contain logo-white mb-2"
            decoding="async"
            loading="lazy"
          />
        </div>

        {/* Middle Column: Contact */}
        <div className="text-xs uppercase tracking-wider space-y-1 font-semibold text-zinc-300">
          <h4 className="font-black text-white tracking-widest text-sm mb-3">Contact</h4>
          <p className="font-bold text-white">Marathon Spirits</p>
          <p>Addis Ababa</p>
          <p>Ethiopia</p>
          <p className="pt-2">Hotline 9891</p>
          <p>
            <a href="mailto:info@marathon-spirits.com" className="hover:text-brand-mustard transition-colors lowercase font-mono">
              info@marathon-spirits.com
            </a>
          </p>
          <p className="pt-3 text-[11px] text-zinc-500">© 2025 Marathon Spirits</p>
        </div>

        {/* Right Column: Follow */}
        <div className="text-xs uppercase tracking-wider space-y-2 font-semibold text-zinc-300">
          <h4 className="font-black text-white tracking-widest text-sm mb-3">Follow</h4>
          <p>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-brand-mustard transition-colors">
              Facebook
            </a>
          </p>
          <p>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-brand-mustard transition-colors">
              Instagram
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default BrandFooter;
