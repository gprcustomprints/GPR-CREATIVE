
import React, { useState, useMemo, useRef } from 'react';
import { SignageParams, AcrylicType, CalculationResult, CustomerInfo, PriceConfig } from './types';
import { INITIAL_PRICE_CONFIG, TERMS_AND_CONDITIONS } from './constants';
import { calculateQuote } from './logic/calculator';
import { parseNaturalLanguageQuery } from './services/geminiService';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Internal breakdown component (admin view)
const InternalBreakdownTable: React.FC<{ result: CalculationResult; title: string }> = ({ result, title }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
    <div className="bg-slate-800 text-white p-4 font-bold tracking-tight">
      {title}
    </div>
    <div className="p-6 flex-grow overflow-y-auto space-y-6">
      <section>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Materials Breakdown</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Acrylic Sheets</span><span>₱{result.materials.acrylic.toLocaleString()}</span></div>
          {result.params.hasCutOuts && <div className="flex justify-between"><span>Acrylic Cut-out Texts</span><span>₱{result.materials.cutOuts.toLocaleString()}</span></div>}
          {result.params.hasSticker && <div className="flex justify-between"><span>Vinyl Sticker Printing</span><span>₱{result.materials.sticker.toLocaleString()}</span></div>}
          <div className="flex justify-between"><span>Mounting Hardware</span><span>₱{result.materials.mounting.toLocaleString()}</span></div>
          {result.materials.lighting && (
            <div className="flex justify-between text-blue-600">
              <span>LED, Power & Wiring</span>
              <span>₱{(result.materials.lighting.led + result.materials.lighting.power + result.materials.lighting.wiring).toLocaleString()}</span>
            </div>
          )}
          <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-slate-900">
            <span>Subtotal Materials</span>
            <span>₱{result.materials.total.toLocaleString()}</span>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Labor & Operations</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Fabrication Labor</span><span>₱{result.labor.fabrication.toLocaleString()}</span></div>
          {result.labor.electrical && <div className="flex justify-between"><span>Electrical Assembly</span><span>₱{result.labor.electrical.toLocaleString()}</span></div>}
          <div className="flex justify-between"><span>Tools & Consumables</span><span>₱{result.operating.tools.toLocaleString()}</span></div>
          <div className="flex justify-between"><span>Business Overhead</span><span>₱{result.operating.overhead.toLocaleString()}</span></div>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Logistics</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Delivery Fee</span><span>₱{result.logistics.delivery.toLocaleString()}</span></div>
          <div className="flex justify-between"><span>Installation Fee</span><span>₱{result.logistics.installation.toLocaleString()}</span></div>
        </div>
      </section>

      <div className="pt-4 border-t-2 border-slate-100">
        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg">
          <span className="font-bold text-slate-900">FINAL SELLING PRICE</span>
          <span className="text-2xl font-black text-slate-700">₱{result.finalPrice.toLocaleString()}</span>
        </div>
      </div>
    </div>
  </div>
);

// Client-facing formal quotation component
const ClientQuotation: React.FC<{ result: CalculationResult; customer: CustomerInfo }> = ({ result, customer }) => (
  <div className="bg-white p-12 shadow-lg border border-slate-200 text-slate-900 max-w-4xl mx-auto" id="client-quote-printable">
    <div className="flex justify-between items-start mb-12">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 bg-indigo-600 rounded flex items-center justify-center text-white font-black text-xl">G</div>
          <span className="font-black text-2xl tracking-tight uppercase">GPR Printing and Advertising</span>
        </div>
        <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">Official Quotation</div>
      </div>
      <div className="text-right space-y-1">
        <div className="text-sm font-bold">Quote #: <span className="text-indigo-600">{customer.quoteNumber}</span></div>
        <div className="text-sm text-slate-500">Date: {customer.date}</div>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-8 mb-12 border-b border-slate-100 pb-8">
      <div>
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Billed To</h4>
        <div className="font-bold text-lg">{customer.name}</div>
        <div className="text-sm text-slate-600">{customer.company}</div>
        <div className="text-sm text-slate-500 mt-2 max-w-[250px]">{customer.address}</div>
        <div className="text-sm text-slate-600 mt-2">{customer.contact}</div>
      </div>
      <div className="text-right">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Project Details</h4>
        <div className="text-sm">
          <span className="font-bold">Acrylic Signage</span><br />
          {result.params.widthFt} × {result.params.heightFt} ft 
          {result.params.isBuildUp ? ' Build-up' : ' Flat'} Sign<br />
          {result.params.type.replace('_', ' ')} Finish<br />
          {result.params.hasLights ? 'Internal LED Lighting included' : 'Non-illuminated'}
        </div>
      </div>
    </div>

    <table className="w-full mb-12">
      <thead>
        <tr className="border-b-2 border-slate-900 text-left text-xs uppercase tracking-widest font-bold">
          <th className="py-4 px-2">Description</th>
          <th className="py-4 px-2 w-24 text-center">Qty</th>
          <th className="py-4 px-2 w-40 text-right">Total Price</th>
        </tr>
      </thead>
      <tbody className="text-sm">
        <tr className="border-b border-slate-100">
          <td className="py-6 px-2">
            <div className="font-bold mb-1">Custom Acrylic Signage Fabrication</div>
            <p className="text-slate-500 text-xs">
              Fabrication and {result.params.hasLights ? 'assembly with LED modules' : 'flat mounting'}. 
              Includes material, labor, logistics, and professional installation.
            </p>
          </td>
          <td className="py-6 px-2 text-center">1 Unit</td>
          <td className="py-6 px-2 text-right font-bold text-lg">₱{result.finalPrice.toLocaleString()}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={2} className="py-6 text-right font-bold uppercase tracking-widest text-xs">Grand Total (PHP)</td>
          <td className="py-6 text-right font-black text-2xl text-indigo-700">₱{result.finalPrice.toLocaleString()}</td>
        </tr>
      </tfoot>
    </table>

    <div className="grid grid-cols-1 gap-6">
      <div className="bg-slate-50 p-6 rounded-lg">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Terms & Conditions</h4>
        <ul className="text-[11px] text-slate-600 space-y-2 list-disc pl-4">
          {TERMS_AND_CONDITIONS.map((term, i) => <li key={i}>{term}</li>)}
        </ul>
      </div>
      <div className="flex justify-between items-end mt-12">
        <div className="text-center">
          <div className="w-48 border-b border-slate-300 mb-2"></div>
          <div className="text-[10px] uppercase font-bold text-slate-400">Client Signature</div>
        </div>
        <div className="text-center">
          <div className="text-xs font-bold mb-1">GPR Operations</div>
          <div className="text-[10px] text-slate-500">Authorized Personnel</div>
        </div>
      </div>
    </div>
  </div>
);

// Price Configuration Modal
const PriceSettingsModal: React.FC<{ 
  config: PriceConfig; 
  onClose: () => void; 
  onSave: (newConfig: PriceConfig) => void 
}> = ({ config, onClose, onSave }) => {
  const [localConfig, setLocalConfig] = useState(config);

  const handleChange = (path: string[], value: number) => {
    const newConfig = JSON.parse(JSON.stringify(localConfig));
    let target = newConfig;
    for (let i = 0; i < path.length - 1; i++) {
      target = target[path[i]];
    }
    target[path[path.length - 1]] = value;
    setLocalConfig(newConfig);
  };

  const inputClass = "w-full bg-slate-700 border border-slate-600 rounded p-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">Pricing Configuration</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Acrylic Prices */}
          <section className="space-y-4">
            <h3 className="font-bold text-indigo-600 uppercase text-xs tracking-widest">Acrylic Sheets (per sq.ft)</h3>
            {Object.entries(localConfig.acrylicPrices).map(([type, thicknesses]) => (
              <div key={type} className="space-y-2">
                <p className="text-xs font-bold text-slate-500">{type.replace('_', ' ')}</p>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(thicknesses).map(([thickness, price]) => (
                    <div key={thickness}>
                      <span className="text-[10px] text-slate-400 block">{thickness}</span>
                      <input 
                        type="number" 
                        value={price} 
                        onChange={(e) => handleChange(['acrylicPrices', type, thickness], Number(e.target.value))}
                        className={inputClass}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* Core Pricing */}
          <section className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-bold text-indigo-600 uppercase text-xs tracking-widest">Base Material Rates</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 block">Cut-out (/sq.ft)</span>
                  <input type="number" value={localConfig.cutOutPricePerSqFt} onChange={(e) => handleChange(['cutOutPricePerSqFt'], Number(e.target.value))} className={inputClass} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Sticker (/sq.in)</span>
                  <input type="number" value={localConfig.stickerPricePerSqIn} onChange={(e) => handleChange(['stickerPricePerSqIn'], Number(e.target.value))} className={inputClass} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Mounting (Pack)</span>
                  <input type="number" value={localConfig.mountingBoltPackPrice} onChange={(e) => handleChange(['mountingBoltPackPrice'], Number(e.target.value))} className={inputClass} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-indigo-600 uppercase text-xs tracking-widest">Labor Costs</h3>
              <div className="grid grid-cols-3 gap-2">
                {['SMALL', 'MEDIUM', 'LARGE'].map((size) => (
                  <div key={size}>
                    <span className="text-[10px] text-slate-400 block">{size}</span>
                    <input type="number" value={(localConfig.labor as any)[size]} onChange={(e) => handleChange(['labor', size], Number(e.target.value))} className={inputClass} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Lighting */}
          <section className="space-y-4">
            <h3 className="font-bold text-indigo-600 uppercase text-xs tracking-widest">Lighting Systems</h3>
            {['SMALL', 'LARGE'].map((size) => (
              <div key={size} className="bg-slate-50 p-3 rounded-lg space-y-2">
                <p className="text-xs font-bold text-slate-500">{size} Sign Configuration</p>
                <div className="grid grid-cols-2 gap-2">
                  {['led', 'power', 'wiring', 'labor'].map((part) => (
                    <div key={part}>
                      <span className="text-[10px] text-slate-400 block uppercase">{part}</span>
                      <input type="number" value={(localConfig.lighting as any)[size][part]} onChange={(e) => handleChange(['lighting', size, part], Number(e.target.value))} className={inputClass} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* Logistics */}
          <section className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-bold text-indigo-600 uppercase text-xs tracking-widest">Logistics & Fees</h3>
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500">Delivery</p>
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-[10px] text-slate-400 block">Motorcycle</span><input type="number" value={localConfig.logistics.delivery.MOTORCYCLE} onChange={(e) => handleChange(['logistics', 'delivery', 'MOTORCYCLE'], Number(e.target.value))} className={inputClass} /></div>
                  <div><span className="text-[10px] text-slate-400 block">Van (L300)</span><input type="number" value={localConfig.logistics.delivery.L300} onChange={(e) => handleChange(['logistics', 'delivery', 'L300'], Number(e.target.value))} className={inputClass} /></div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500">Installation</p>
                <div className="grid grid-cols-3 gap-2">
                  <div><span className="text-[10px] text-slate-400 block">Small</span><input type="number" value={localConfig.logistics.installation.SMALL} onChange={(e) => handleChange(['logistics', 'installation', 'SMALL'], Number(e.target.value))} className={inputClass} /></div>
                  <div><span className="text-[10px] text-slate-400 block">Large</span><input type="number" value={localConfig.logistics.installation.LARGE} onChange={(e) => handleChange(['logistics', 'installation', 'LARGE'], Number(e.target.value))} className={inputClass} /></div>
                  <div><span className="text-[10px] text-slate-400 block">Far Surcharge</span><input type="number" value={localConfig.logistics.installation.FAR_SURCHARGE} onChange={(e) => handleChange(['logistics', 'installation', 'FAR_SURCHARGE'], Number(e.target.value))} className={inputClass} /></div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Cancel</button>
          <button onClick={() => onSave(localConfig)} className="px-8 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [params, setParams] = useState<SignageParams>({
    widthFt: 2,
    heightFt: 2,
    type: AcrylicType.WHITE,
    thickness: '6mm',
    isBuildUp: true,
    hasSticker: true,
    hasCutOuts: false,
    hasLights: true,
    isInstallationFar: false,
    depthIn: 1
  });

  const [priceConfig, setPriceConfig] = useState<PriceConfig>(INITIAL_PRICE_CONFIG);
  const [showSettings, setShowSettings] = useState(false);

  const [customer, setCustomer] = useState<CustomerInfo>({
    name: "John Doe",
    company: "Acme Corp PH",
    address: "Unit 1204, High Street Tower, BGC, Taguig City",
    contact: "0917-000-0000",
    quoteNumber: `QT-${Math.floor(Math.random() * 9000) + 1000}`,
    date: new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
  });

  const [naturalQuery, setNaturalQuery] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [viewMode, setViewMode] = useState<'admin' | 'client'>('admin');
  
  const adminRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<HTMLDivElement>(null);

  const quoteWithLights = useMemo(() => calculateQuote({ ...params, hasLights: true }, priceConfig), [params, priceConfig]);
  const quoteNoLights = useMemo(() => calculateQuote({ ...params, hasLights: false }, priceConfig), [params, priceConfig]);

  const handleGeminiParse = async () => {
    if (!naturalQuery.trim()) return;
    setIsParsing(true);
    const extracted = await parseNaturalLanguageQuery(naturalQuery);
    if (extracted) {
      setParams(prev => ({ ...prev, ...extracted }));
    }
    setIsParsing(false);
  };

  const handleInputChange = (field: keyof SignageParams, value: any) => {
    setParams(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomerChange = (field: keyof CustomerInfo, value: string) => {
    setCustomer(prev => ({ ...prev, [field]: value }));
  };

  const handleSavePDF = async () => {
    const targetRef = viewMode === 'admin' ? adminRef : clientRef;
    if (!targetRef.current) return;
    
    setIsGeneratingPDF(true);
    try {
      const canvas = await html2canvas(targetRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: viewMode === 'admin' ? '#f8fafc' : '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: viewMode === 'admin' ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`${customer.quoteNumber}-Quotation-${viewMode}.pdf`);
    } catch (err) {
      console.error('PDF Generation Failed:', err);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 no-print">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-black">G</div>
            <h1 className="font-bold text-slate-900 text-lg hidden sm:block tracking-tight">GPR Printing & Advertising Engine</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 text-slate-400 hover:text-indigo-600 transition-colors bg-slate-50 rounded-lg border border-slate-100"
              title="Price Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </button>

            <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setViewMode('admin')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Admin
              </button>
              <button 
                onClick={() => setViewMode('client')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'client' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Client
              </button>
            </div>
            
            <button 
              onClick={handleSavePDF}
              disabled={isGeneratingPDF}
              className={`text-xs font-bold transition-colors uppercase tracking-widest px-4 py-2 rounded-lg ${
                isGeneratingPDF ? 'bg-slate-100 text-slate-300' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
              }`}
            >
              {isGeneratingPDF ? '...' : 'PDF'}
            </button>
          </div>
        </div>
      </header>

      {showSettings && (
        <PriceSettingsModal 
          config={priceConfig} 
          onClose={() => setShowSettings(false)} 
          onSave={(newConfig) => {
            setPriceConfig(newConfig);
            setShowSettings(false);
          }} 
        />
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls Column */}
          <div className="lg:col-span-4 space-y-6 no-print">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-2xl shadow-lg shadow-indigo-200">
              <label className="block text-white text-xs font-bold uppercase tracking-widest mb-3 opacity-80">AI Quick Setup</label>
              <div className="relative">
                <textarea 
                  value={naturalQuery}
                  onChange={(e) => setNaturalQuery(e.target.value)}
                  placeholder="Describe your signage project..."
                  className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 min-h-[80px]"
                />
                <button onClick={handleGeminiParse} disabled={isParsing} className="absolute bottom-2 right-2 bg-white text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                  {isParsing ? '...' : 'Auto-Fill'}
                </button>
              </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Billing Information</label>
              <div className="space-y-4">
                <input 
                  placeholder="Client Name" 
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  value={customer.name} 
                  onChange={(e) => handleCustomerChange('name', e.target.value)} 
                />
                <input 
                  placeholder="Company Name" 
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  value={customer.company} 
                  onChange={(e) => handleCustomerChange('company', e.target.value)} 
                />
                <input 
                  placeholder="Contact Details" 
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  value={customer.contact} 
                  onChange={(e) => handleCustomerChange('contact', e.target.value)} 
                />
                <textarea 
                  placeholder="Complete Address" 
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20" 
                  value={customer.address} 
                  onChange={(e) => handleCustomerChange('address', e.target.value)} 
                />
              </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700 space-y-6">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Signage Specs</label>
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="number" 
                  placeholder="W" 
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  value={params.widthFt} 
                  onChange={(e) => handleInputChange('widthFt', Number(e.target.value))} 
                />
                <input 
                  type="number" 
                  placeholder="H" 
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  value={params.heightFt} 
                  onChange={(e) => handleInputChange('heightFt', Number(e.target.value))} 
                />
              </div>
              <select 
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                value={params.type} 
                onChange={(e) => handleInputChange('type', e.target.value)}
              >
                <option value={AcrylicType.WHITE} className="bg-slate-800">White</option>
                <option value={AcrylicType.COLORED_BLACK} className="bg-slate-800">Colored/Black</option>
                <option value={AcrylicType.CLEAR} className="bg-slate-800">Clear</option>
              </select>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer text-slate-200">
                  <input type="checkbox" checked={params.isBuildUp} onChange={(e) => handleInputChange('isBuildUp', e.target.checked)} className="rounded border-slate-600 bg-slate-700 text-indigo-600 focus:ring-indigo-500" /> 
                  3D Build-up
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer text-slate-200">
                  <input type="checkbox" checked={params.hasLights} onChange={(e) => handleInputChange('hasLights', e.target.checked)} className="rounded border-slate-600 bg-slate-700 text-indigo-600 focus:ring-indigo-500" /> 
                  Internal Lighting
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer text-slate-200">
                  <input type="checkbox" checked={params.hasSticker} onChange={(e) => handleInputChange('hasSticker', e.target.checked)} className="rounded border-slate-600 bg-slate-700 text-indigo-600 focus:ring-indigo-500" /> 
                  Vinyl Print
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer text-slate-200">
                  <input type="checkbox" checked={params.isInstallationFar} onChange={(e) => handleInputChange('isInstallationFar', e.target.checked)} className="rounded border-slate-600 bg-slate-700 text-indigo-600 focus:ring-indigo-500" /> 
                  Outside City
                </label>
              </div>
            </div>
          </div>

          {/* Quotation Outputs Column */}
          <div className="lg:col-span-8">
            {viewMode === 'admin' ? (
              <div ref={adminRef} className="space-y-8 p-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                  <InternalBreakdownTable title="OPTION: ILLUMINATED" result={quoteWithLights} />
                  <InternalBreakdownTable title="OPTION: NON-ILLUMINATED" result={quoteNoLights} />
                </div>
                <div className="bg-slate-900 text-white p-8 rounded-2xl flex justify-between items-center">
                  <div><h2 className="text-xl font-bold">Internal Summary</h2><p className="text-slate-400 text-sm">Profit: 100% Markup applied.</p></div>
                  <div className="text-right"><div className="text-amber-400 text-3xl font-black">₱{(params.hasLights ? quoteWithLights.finalPrice : quoteNoLights.finalPrice).toLocaleString()}</div></div>
                </div>
              </div>
            ) : (
              <div ref={clientRef} className="p-1">
                <ClientQuotation result={params.hasLights ? quoteWithLights : quoteNoLights} customer={customer} />
              </div>
            )}
          </div>

        </div>
      </main>
      
      <footer className="max-w-7xl mx-auto px-4 py-8 border-t border-slate-200 mt-12 text-center text-slate-400 text-xs no-print">
        Official GPR Printing and Advertising Quote Engine &bull; Developed for Signage Manufacturers Philippines
      </footer>
    </div>
  );
};

export default App;
