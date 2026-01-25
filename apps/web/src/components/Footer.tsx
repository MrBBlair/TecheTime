import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 mt-auto" role="contentinfo">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center space-y-4">
          <Link to="/" className="focus:outline-none focus:ring-2 focus:ring-royal-purple focus:ring-offset-2 rounded" aria-label="Tech eTime Home">
            <Logo variant="footer" alt="Tech eTime" />
          </Link>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-charcoal">
            <Link
              to="/terms"
              className="hover:text-royal-purple transition-colors focus:outline-none focus:ring-2 focus:ring-royal-purple focus:ring-offset-2 rounded px-2 py-1"
            >
              Terms and Conditions
            </Link>
            <span className="text-gray-400">|</span>
            <Link
              to="/privacy"
              className="hover:text-royal-purple transition-colors focus:outline-none focus:ring-2 focus:ring-royal-purple focus:ring-offset-2 rounded px-2 py-1"
            >
              Privacy Policy
            </Link>
          </div>
          <div className="text-center text-sm text-gray-600">
            Powered by{' '}
            <a
              href="https://techephi.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-royal-purple hover:text-old-gold transition-colors font-semibold focus:outline-none focus:ring-2 focus:ring-royal-purple focus:ring-offset-2 rounded px-1"
            >
              Techephi
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
