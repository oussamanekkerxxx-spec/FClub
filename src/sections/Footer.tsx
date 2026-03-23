import { useRef, useLayoutEffect, useState } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Flame, Send, Twitter, Linkedin, Github, Instagram } from 'lucide-react';
import { toast } from 'sonner';

interface FooterProps {
  className?: string;
}

const footerLinks = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'Dashboard', href: '#dashboard' },
    { label: 'Mobile App', href: '#' },
    { label: 'Integrations', href: '#' },
  ],
  support: [
    { label: 'Help Center', href: '#' },
    { label: 'Contact Us', href: '#' },
    { label: 'Status', href: '#' },
    { label: 'Feedback', href: '#' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
    { label: 'GDPR', href: '#' },
  ],
};

const socialLinks = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Github, href: '#', label: 'GitHub' },
  { icon: Instagram, href: '#', label: 'Instagram' },
];

export default function Footer({ className = '' }: FooterProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;

    if (!section || !content) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        content,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 90%',
            end: 'top 60%',
            scrub: 0.5,
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast.success('Thanks for subscribing!');
      setEmail('');
    }
  };

  return (
    <footer
      ref={sectionRef}
      id="footer"
      className={`section-flowing bg-brand-text-primary text-white ${className}`}
    >
      {/* Dot Pattern Background */}
      <div className="absolute inset-0 dot-pattern pointer-events-none opacity-[0.04]" />

      <div ref={contentRef} className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-[8vw] py-16 lg:py-20">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-4">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-accent flex items-center justify-center">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <span className="font-heading font-semibold text-xl text-white">
                FightClub
              </span>
            </Link>
            <p className="text-white/70 leading-relaxed mb-6 max-w-sm">
              From students. To students. A peer-to-peer skill-sharing community where curious people teach each other what they know.
            </p>

            {/* Newsletter */}
            <div>
              <h4 className="font-medium text-white mb-3">Get updates</h4>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
                />
                <Button
                  type="submit"
                  className="bg-brand-accent hover:bg-brand-accent/90 text-white px-4"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-6 grid grid-cols-3 gap-8">
            <div>
              <h4 className="font-medium text-white mb-4">Product</h4>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-white/70 hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-4">Support</h4>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-white/70 hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-4">Legal</h4>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-white/70 hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Social Column */}
          <div className="lg:col-span-2">
            <h4 className="font-medium text-white mb-4">Follow us</h4>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <social.icon className="w-5 h-5 text-white" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/50">
            © 2024 FightClub. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              to="/app"
              className="text-sm text-white/50 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/onboarding"
              className="text-sm text-brand-accent hover:text-brand-accent/80 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
