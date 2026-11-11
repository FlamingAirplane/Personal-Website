'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Mail, Phone, FileText, Send, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
  profile: any;
}

export function ContactSection({ profile }: Props) {
  const safeProfile = profile ?? {};
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e?.preventDefault?.();
    if (!formData?.name?.trim?.() || !formData?.email?.trim?.()) {
      toast?.error?.('Please fill in your name and email');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res?.json?.();
      if (data?.success) {
        toast?.success?.('Message sent successfully!');
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        toast?.error?.(data?.message ?? 'Failed to send message');
      }
    } catch (err: any) {
      console.error('Contact form error:', err);
      toast?.error?.('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleDownloadResume = async () => {
    try {
      const res = await fetch('/api/resume');
      const data = await res?.json?.();
      if (data?.url) {
        const a = document?.createElement?.('a');
        if (a) {
          a.href = data.url;
          a.download = 'Adine_Johnson_Resume.pdf';
          document?.body?.appendChild?.(a);
          a?.click?.();
          document?.body?.removeChild?.(a);
        }
      } else {
        toast?.info?.('Resume not yet available. Please check back later.');
      }
    } catch (err: any) {
      console.error('Resume download error:', err);
      toast?.error?.('Could not download resume right now.');
    }
  };

  return (
    <div ref={ref} className="py-20 px-6 md:px-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="max-w-5xl mx-auto"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Mail className="text-[#94a348]" size={28} />
              <h2 className="text-3xl font-bold text-[#f3f7e4] tracking-tight">Get In Touch</h2>
            </div>
            <p className="text-[#c8d4a8] mb-6">Like my work? Let&apos;s talk!</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[#8a9a70] text-sm mb-1 block">Name *</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a6a40]" />
                  <input
                    type="text"
                    value={formData?.name ?? ''}
                    onChange={(e: any) => setFormData({ ...(formData ?? {}), name: e?.target?.value ?? '' })}
                    className="w-full bg-[#1a2e38] text-[#f3f7e4] rounded-lg pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-[#94a348] placeholder-[#5a6a40]"
                    placeholder="Your name"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-[#8a9a70] text-sm mb-1 block">Email *</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a6a40]" />
                  <input
                    type="email"
                    value={formData?.email ?? ''}
                    onChange={(e: any) => setFormData({ ...(formData ?? {}), email: e?.target?.value ?? '' })}
                    className="w-full bg-[#1a2e38] text-[#f3f7e4] rounded-lg pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-[#94a348] placeholder-[#5a6a40]"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-[#8a9a70] text-sm mb-1 block">Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a6a40]" />
                  <input
                    type="tel"
                    value={formData?.phone ?? ''}
                    onChange={(e: any) => setFormData({ ...(formData ?? {}), phone: e?.target?.value ?? '' })}
                    className="w-full bg-[#1a2e38] text-[#f3f7e4] rounded-lg pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-[#94a348] placeholder-[#5a6a40]"
                    placeholder="Your phone number"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#8a9a70] text-sm mb-1 block">Message</label>
                <textarea
                  value={formData?.message ?? ''}
                  onChange={(e: any) => setFormData({ ...(formData ?? {}), message: e?.target?.value ?? '' })}
                  className="w-full bg-[#1a2e38] text-[#f3f7e4] rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#94a348] placeholder-[#5a6a40] min-h-[100px] resize-y"
                  placeholder="Your message..."
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#94a348] text-[#0a0c04] font-semibold rounded-lg hover:bg-[#a8b850] transition-colors disabled:opacity-50"
              >
                {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {sending ? 'Sending...' : 'Send Message'}
              </button>
              <p className="text-[#5a6a40] text-xs mt-2">Your data is stored securely and will only be used to respond to your inquiry.</p>
            </form>
          </div>

          {/* Contact Info & Resume */}
          <div className="space-y-6">
            <div className="bg-[#1a2e38] rounded-xl p-6 shadow-md">
              <h3 className="text-[#94a348] font-semibold mb-4">Contact Info</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-[#94a348]" />
                  <div>
                    <p className="text-[#8a9a70] text-xs">Email</p>
                    <p className="text-[#f3f7e4]">AAdineWJ3@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-[#94a348]" />
                  <div>
                    <p className="text-[#8a9a70] text-xs">Phone</p>
                    <p className="text-[#f3f7e4]">346-234-5895</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#1a2e38] rounded-xl p-6 shadow-md">
              <h3 className="text-[#94a348] font-semibold mb-4">Resume</h3>
              <p className="text-[#c8d4a8] text-sm mb-4">Download my resume to learn more about my experience and skills.</p>
              <button
                onClick={handleDownloadResume}
                className="flex items-center gap-2 px-5 py-3 bg-[#94a348] text-[#0a0c04] font-semibold rounded-lg hover:bg-[#a8b850] transition-colors w-full justify-center"
              >
                <FileText size={18} />
                Download Resume
              </button>
            </div>

            <div className="bg-[#1a2e38] rounded-xl p-6 shadow-md">
              <h3 className="text-[#94a348] font-semibold mb-4">Social Media</h3>
              <div className="flex gap-3">
                <a href="#" className="flex items-center gap-2 px-4 py-2 bg-[#0a0c04]/50 rounded-lg text-[#c8d4a8] hover:text-[#94a348] hover:bg-[#0a0c04] transition-colors text-sm">
                  Twitter
                </a>
                <a href="#" className="flex items-center gap-2 px-4 py-2 bg-[#0a0c04]/50 rounded-lg text-[#c8d4a8] hover:text-[#94a348] hover:bg-[#0a0c04] transition-colors text-sm">
                  Instagram
                </a>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
