
import React, { useState } from 'react';
import { Card, Button, Input } from '../../app/DesignSystem';

const HelpFaqPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    { q: "How does the weather sync work?", a: "We use high-precision geolocation and weather API to get real-time data for your exact neighborhood, updated every hour." },
    { q: "Can I add custom items to my closet?", a: "Yes! Simply go to My Closet and click 'Add Item'. You can upload a photo and tag it with seasons and categories." },
    { q: "What happens if the weather changes mid-day?", a: "CODION will send you a push notification suggesting an 'Adjustment Layer' like a cardigan or umbrella if rain is detected." },
    { q: "Is my data private?", a: "Your closet inventory is encrypted and only visible to you. We do not sell your style preferences to third parties." },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-black text-navy-900 mb-4">Help Center</h1>
        <div className="max-w-md mx-auto relative">
           <Input placeholder="Search for answers..." className="pl-12 py-4 shadow-lg border-0 ring-1 ring-slate-200" />
           <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-navy-900">Frequently Asked Questions</h3>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all">
              <button 
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left font-bold text-navy-800 hover:bg-slate-50"
              >
                {faq.q}
                <span className={`transition-transform ${openIndex === i ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {openIndex === i && (
                <div className="px-5 pb-5 text-slate-500 text-sm leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Card className="bg-orange-50 border-orange-100 p-8 text-center">
         <div className="text-3xl mb-4">💬</div>
         <h3 className="text-xl font-bold text-navy-900 mb-2">Still need help?</h3>
         <p className="text-slate-600 mb-6">Our support team is available 24/7 to help you with any issues or feedback.</p>
         <Button>Contact Support</Button>
      </Card>
    </div>
  );
};

export default HelpFaqPage;
