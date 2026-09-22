import React, { useState } from 'react';
import { TargetSite, ScriptStep } from '../types';
import {
  Camera,
  CheckCircle2,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  MousePointer,
  Navigation,
} from 'lucide-react';

interface TargetSandboxProps {
  target: TargetSite;
  isRecording: boolean;
  onRecordStep: (step: Omit<ScriptStep, 'id'>) => void;
}

export const TargetSandbox: React.FC<TargetSandboxProps> = ({
  target,
  isRecording,
  onRecordStep,
}) => {
  const [activeStoryPage, setActiveStoryPage] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [customInputText, setCustomInputText] = useState('');
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);

  const isPicurici = target.baseUrl.includes('picurici') || target.name.toLowerCase().includes('case');

  const handleHouseClick = (houseName: string, houseIndex: number) => {
    if (isRecording) {
      const selectorName = houseIndex === 1 ? 'first house' : houseIndex === 2 ? 'second house' : 'third house';
      onRecordStep({
        action: 'click',
        selector: selectorName,
        description: `Click element: ${selectorName} (${houseName})`,
      });
      onRecordStep({
        action: 'assert_url_contains',
        expected: '/story',
        description: `Assert URL contains "/story" for ${houseName}`,
      });
    }
    setActiveStoryPage(houseName);
  };

  const handleToggleAudio = () => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    if (isRecording) {
      onRecordStep({
        action: 'click',
        selector: 'text=Audio: ON 🔊',
        description: `Click audio toggle (Audio set to ${newState ? 'ON' : 'OFF'})`,
      });
    }
  };

  const handleScreenshotCheckpoint = () => {
    const label = activeStoryPage ? `story-${activeStoryPage.toLowerCase().replace(/\s+/g, '-')}` : 'homepage-overview';
    onRecordStep({
      action: 'screenshot',
      value: label,
      description: `Capture screenshot checkpoint: "${label}"`,
    });
  };

  const handleAssertVisibleMain = () => {
    onRecordStep({
      action: 'assert_visible',
      selector: 'main illustration',
      description: 'Assert visible: main illustration',
    });
  };

  const handleGoBack = () => {
    setActiveStoryPage(null);
    if (isRecording) {
      onRecordStep({
        action: 'go_back',
        description: 'Navigate back to homepage',
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
      {/* Sandbox Top Bar with Recording Controls */}
      <div className="bg-slate-800/90 border-b border-slate-700 px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-slate-400 font-mono text-[11px] ml-2 truncate max-w-xs">
            {target.baseUrl}{activeStoryPage ? `story/${activeStoryPage.toLowerCase()}` : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isRecording ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full font-semibold animate-pulse text-[11px]">
              <Radio className="h-3 w-3" />
              <span>REC ON: Click any element to capture step</span>
            </div>
          ) : (
            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              <MousePointer className="h-3 w-3" /> Live Simulator
            </span>
          )}

          <button
            onClick={handleScreenshotCheckpoint}
            className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-1 rounded text-[11px] font-medium transition-colors"
            title="Add a screenshot assertion checkpoint"
          >
            <Camera className="h-3.5 w-3.5 text-blue-400" />
            <span>Screenshot</span>
          </button>
        </div>
      </div>

      {/* Simulator Viewport */}
      <div className="flex-1 overflow-auto bg-slate-950 p-4 relative">
        {hoveredElement && isRecording && (
          <div className="fixed bottom-6 right-6 z-40 bg-slate-900/95 border border-blue-500/50 text-blue-300 px-3 py-1.5 rounded-lg shadow-xl text-xs font-mono">
            Target Selector: <span className="text-white font-bold">{hoveredElement}</span>
          </div>
        )}

        {isPicurici ? (
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden text-slate-800 border border-slate-200">
            {/* Target App Top Header */}
            <header className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => {
                  if (isRecording) {
                    onRecordStep({
                      action: 'assert_text',
                      selector: 'h1',
                      expected: 'Picurici — Cele Trei Căsuțe',
                      description: 'Assert main title contains "Picurici — Cele Trei Căsuțe"',
                    });
                  }
                }}
                onMouseEnter={() => setHoveredElement('h1 title')}
                onMouseLeave={() => setHoveredElement(null)}
              >
                <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center text-xl shadow-sm">
                  🐷
                </div>
                <div>
                  <h1 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                    Picurici — Cele Trei Căsuțe
                  </h1>
                  <p className="text-xs text-slate-500">Poveste interactivă audio-vizuală</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleAudio}
                  onMouseEnter={() => setHoveredElement('audio toggle')}
                  onMouseLeave={() => setHoveredElement(null)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    audioEnabled
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-slate-100 text-slate-600 border-slate-300'
                  }`}
                >
                  {audioEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                  <span>{audioEnabled ? 'Audio: ON 🔊' : 'Audio: OFF 🔇'}</span>
                </button>

                {activeStoryPage && (
                  <button
                    onClick={handleGoBack}
                    className="flex items-center gap-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    <Navigation className="h-3 w-3" />
                    <span>Înapoi</span>
                  </button>
                )}
              </div>
            </header>

            {/* Content Area */}
            {!activeStoryPage ? (
              <div className="p-6 space-y-6">
                {/* Main Illustration Banner */}
                <div
                  className="relative rounded-xl overflow-hidden bg-gradient-to-r from-sky-400 via-sky-300 to-amber-200 p-8 text-slate-900 cursor-pointer border-2 border-transparent hover:border-blue-400 transition-all shadow-inner"
                  onClick={handleAssertVisibleMain}
                  onMouseEnter={() => setHoveredElement('main illustration')}
                  onMouseLeave={() => setHoveredElement(null)}
                >
                  <div className="max-w-md">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-900 bg-white/70 px-2 py-0.5 rounded">
                      Ilustrație Principală
                    </span>
                    <h2 className="text-2xl font-extrabold mt-2 text-slate-900">
                      Trei purceluși și trei căsuțe fermecate
                    </h2>
                    <p className="text-sm text-slate-700 mt-2">
                      Fiecare căsuță este construită dintr-un material diferit: paie, lemn și cărămidă. Apasă pe fiecare casă pentru a citi povestea.
                    </p>
                  </div>
                  <div className="absolute right-6 bottom-4 text-6xl opacity-90 select-none">
                    🏡🌳
                  </div>
                </div>

                {/* 3 Houses Grid */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-800 text-sm">Alege o căsuță de explorat:</h3>
                    {isRecording && (
                      <span className="text-xs text-blue-600 font-medium">
                        Click on any house to record navigation & assertions
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* House 1 */}
                    <div
                      onClick={() => handleHouseClick('Căsuța de Paie', 1)}
                      onMouseEnter={() => setHoveredElement('first house')}
                      onMouseLeave={() => setHoveredElement(null)}
                      className="border border-amber-200 hover:border-amber-400 bg-amber-50/60 rounded-xl p-4 cursor-pointer transition-all hover:shadow-md group text-center"
                    >
                      <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🌾</div>
                      <h4 className="font-bold text-slate-900 text-sm">1. Căsuța de Paie</h4>
                      <p className="text-xs text-slate-600 mt-1">Ușor de construit, dar sensibilă la suflarea lupului.</p>
                      <button className="mt-3 text-xs bg-amber-600 group-hover:bg-amber-500 text-white font-medium px-3 py-1 rounded-lg w-full">
                        Explorează Paie
                      </button>
                    </div>

                    {/* House 2 */}
                    <div
                      onClick={() => handleHouseClick('Căsuța de Lemn', 2)}
                      onMouseEnter={() => setHoveredElement('second house')}
                      onMouseLeave={() => setHoveredElement(null)}
                      className="border border-orange-200 hover:border-orange-400 bg-orange-50/60 rounded-xl p-4 cursor-pointer transition-all hover:shadow-md group text-center"
                    >
                      <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🪵</div>
                      <h4 className="font-bold text-slate-900 text-sm">2. Căsuța de Lemn</h4>
                      <p className="text-xs text-slate-600 mt-1">Construită din crengi și bârne de fag din pădure.</p>
                      <button className="mt-3 text-xs bg-orange-600 group-hover:bg-orange-500 text-white font-medium px-3 py-1 rounded-lg w-full">
                        Explorează Lemn
                      </button>
                    </div>

                    {/* House 3 */}
                    <div
                      onClick={() => handleHouseClick('Căsuța de Cărămidă', 3)}
                      onMouseEnter={() => setHoveredElement('third house')}
                      onMouseLeave={() => setHoveredElement(null)}
                      className="border border-rose-200 hover:border-rose-400 bg-rose-50/60 rounded-xl p-4 cursor-pointer transition-all hover:shadow-md group text-center"
                    >
                      <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🧱</div>
                      <h4 className="font-bold text-slate-900 text-sm">3. Căsuța de Cărămidă</h4>
                      <p className="text-xs text-slate-600 mt-1">Trainică, rezistentă la orice furtună și suflare.</p>
                      <button className="mt-3 text-xs bg-rose-600 group-hover:bg-rose-500 text-white font-medium px-3 py-1 rounded-lg w-full">
                        Explorează Cărămidă
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Story Detail View */
              <div className="p-8 space-y-6">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Capitol: /story/{activeStoryPage.toLowerCase().replace(/\s+/g, '-')}
                  </span>
                  <h2
                    className="text-2xl font-bold text-slate-900 mt-2 cursor-pointer hover:text-blue-600"
                    onClick={() => {
                      if (isRecording) {
                        onRecordStep({
                          action: 'assert_visible',
                          selector: 'story title',
                          description: `Assert visible: story title "${activeStoryPage}"`,
                        });
                      }
                    }}
                    onMouseEnter={() => setHoveredElement('story title')}
                    onMouseLeave={() => setHoveredElement(null)}
                  >
                    Povestea: {activeStoryPage}
                  </h2>

                  <p className="text-slate-700 text-sm mt-3 leading-relaxed">
                    Purcelușul a lucrat din greu pentru a pune cap la cap fiecare detaliu. Când lupul a sosit la poartă și a strigat
                    &ldquo;Deschideți ușa!&rdquo;, frații s-au adăpostit în siguranță.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleScreenshotCheckpoint}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span>Take Story Screenshot Checkpoint</span>
                    </button>
                    <button
                      onClick={handleGoBack}
                      className="flex items-center gap-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      <span>Înapoi la cele 3 case</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Generic Target Simulator */
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-6 text-slate-800">
            <h2 className="text-xl font-bold text-slate-900">{target.name}</h2>
            <p className="text-xs text-slate-500 mt-1 font-mono">{target.baseUrl}</p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Interactive Input Test</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customInputText}
                    onChange={(e) => setCustomInputText(e.target.value)}
                    placeholder="Type value to simulate user typing..."
                    className="flex-1 text-xs border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => {
                      if (isRecording) {
                        onRecordStep({
                          action: 'type',
                          selector: 'input[name="search"]',
                          value: customInputText || 'automated test',
                          description: `Type "${customInputText || 'automated test'}" into input[name="search"]`,
                        });
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-2 rounded"
                  >
                    Record Type
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex gap-3">
                <button
                  onClick={() => {
                    if (isRecording) {
                      onRecordStep({
                        action: 'click',
                        selector: 'button.submit-btn',
                        description: 'Click button.submit-btn',
                      });
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-4 py-2 rounded"
                >
                  Click Primary CTA
                </button>
                <button
                  onClick={handleScreenshotCheckpoint}
                  className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium px-3 py-2 rounded flex items-center gap-1.5"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>Record Screenshot</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
