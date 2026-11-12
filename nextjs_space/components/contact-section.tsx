'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { FileText } from 'lucide-react';

interface Props {
  profile: any;
}

// Resume and social links. (The contact form was removed when the site
// moved to static hosting; set the links in lib/content.ts.)
export function ContactSection({ profile }: Props) {
  const safeProfile = profile ?? {};
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const resumeUrl: string = safeProfile?.resumeUrl ?? '';
  const email: string = safeProfile?.email ?? '';
  const phone: string = safeProfile?.phone ?? '';
  const socials = [
    { label: 'Twitter', url: safeProfile?.twitterUrl ?? '' },
    { label: 'Instagram', url: safeProfile?.instagramUrl ?? '' },
  ].filter((s) => s.url);

  return (
    <div ref={ref} className="py-20 px-6 md:px-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="max-w-5xl mx-auto"
      >
        <div className="flex items-center gap-3 mb-6">
          <FileText className="text-[#94a348]" size={28} />
          <h2 className="text-3xl font-bold text-[#f3f7e4] tracking-tight">Resume</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#1a2e38] rounded-xl p-6 shadow-md">
            <p className="text-[#c8d4a8] text-sm mb-4">
              Download my resume to learn more about my experience and skills.
            </p>
            {resumeUrl ? (
              <a
                href={resumeUrl}
                download="Adine_Johnson_Resume.pdf"
                className="flex items-center gap-2 px-5 py-3 bg-[#94a348] text-[#0a0c04] font-semibold rounded-lg hover:bg-[#a8b850] transition-colors w-full justify-center"
              >
                <FileText size={18} />
                Download Resume
              </a>
            ) : (
              <p className="text-[#8a9a70] text-sm">Resume coming soon.</p>
            )}
          </div>

          {(email || phone) && (
            <div className="bg-[#1a2e38] rounded-xl p-6 shadow-md">
              <h3 className="text-[#94a348] font-semibold mb-4">Contact Info</h3>
              <div className="flex flex-col gap-3 text-sm">
                {email && (
                  <a href={`mailto:${email}`} className="text-[#c8d4a8] hover:text-[#94a348] transition-colors">
                    {email}
                  </a>
                )}
                {phone && (
                  <a href={`tel:${phone.replace(/[^0-9+]/g, '')}`} className="text-[#c8d4a8] hover:text-[#94a348] transition-colors">
                    {phone}
                  </a>
                )}
              </div>
            </div>
          )}

          {socials.length > 0 && (
            <div className="bg-[#1a2e38] rounded-xl p-6 shadow-md">
              <h3 className="text-[#94a348] font-semibold mb-4">Social Media</h3>
              <div className="flex gap-3">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-[#0a0c04]/50 rounded-lg text-[#c8d4a8] hover:text-[#94a348] hover:bg-[#0a0c04] transition-colors text-sm"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
