import { Search, MessageCircle, Users } from 'lucide-react';

interface Props {
  className?: string;
}

const STEPS = [
  {
    icon: Search,
    title: 'Browse skills in your city',
    description: 'Find real people teaching piano, yoga, cooking, photography, and more — right here in Marrakesh.',
    color: 'var(--color-amber)',
    bg: '#FFF3E0',
  },
  {
    icon: MessageCircle,
    title: 'Message a teacher',
    description: 'Ask questions, discuss what you want to learn, and agree on a time and place that works for both of you.',
    color: 'var(--color-plum)',
    bg: '#F3E8FF',
  },
  {
    icon: Users,
    title: 'Meet and learn',
    description: 'Show up, learn something real from a real person. Leave a review. Come back for more.',
    color: 'var(--color-forest)',
    bg: '#E8F5EE',
  },
];

export default function HowItWorks({ className }: Props) {
  return (
    <section id="how-it-works" className={`py-20 px-6 ${className || ''}`} style={{ background: 'white' }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-xs font-semibold uppercase tracking-widest font-body mb-2" style={{ color: 'var(--color-amber)' }}>
            How it works
          </div>
          <h2 className="font-heading text-3xl text-navy">
            Three steps to your next skill
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="text-center">
                <div
                  className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                  style={{ background: step.bg }}
                >
                  <Icon className="w-7 h-7" style={{ color: step.color }} />
                </div>
                <div className="font-heading text-navy text-lg mb-2">
                  {step.title}
                </div>
                <p className="font-body text-[var(--color-text-secondary)] text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
