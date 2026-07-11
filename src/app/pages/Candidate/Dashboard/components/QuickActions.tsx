import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PRIMARY_COLOR_HEX } from '@/config/theme';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();
  return <></>

  // return (
  //   <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4 text-slate-800 antialiased">
  //     <div>
  //       <h3 className="text-sm font-bold text-slate-900 tracking-tight">
  //         Quick Actions
  //       </h3>
  //       <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
  //         Keep your profile current and jump back into open opportunities.
  //       </p>
  //     </div>

  //     {/* Button Execution Triggers */}
  //     <div className="flex flex-col gap-2">
  //       <button
  //         type="button"
  //         onClick={() => navigate('/dashboard/job-search')}
  //         className="w-full rounded-xl px-4 py-2.5 text-xs font-bold !text-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
  //         style={{
  //           backgroundColor: PRIMARY_COLOR_HEX,
  //           boxShadow: `0 1px 3px 0 ${PRIMARY_COLOR_HEX}33`,
  //         }}
  //         onMouseEnter={(e) => {
  //           e.currentTarget.style.backgroundColor = (() => {
  //             // Darken the color slightly for hover
  //             const hex = PRIMARY_COLOR_HEX.replace('#', '');
  //             const num = parseInt(hex, 16);
  //             const amt = -20;
  //             const usePound = true;
  //             const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  //             const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  //             const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  //             return (
  //               (usePound ? '#' : '') +
  //               (
  //                 0x1000000 +
  //                 (R < 16 ? 0 : 0) * 0x1000000 +
  //                 R * 0x10000 +
  //                 (G < 16 ? 0 : 0) * 0x100 +
  //                 G * 0x100 +
  //                 (B < 16 ? 0 : 0) +
  //                 B
  //               )
  //                 .toString(16)
  //                 .slice(1)
  //             );
  //           })();
  //         }}
  //         onMouseLeave={(e) => {
  //           e.currentTarget.style.backgroundColor = PRIMARY_COLOR_HEX;
  //         }}
  //       >
  //         <span className="material-symbols-outlined text-[16px]">search</span>
  //         Browse Vacancies
  //       </button>

  //       <button
  //         type="button"
  //         onClick={() => navigate('/dashboard/profile')}
  //         className="w-full rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold px-4 py-2.5 text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
  //       >
  //         <span className="material-symbols-outlined text-[16px]">
  //           person_edit
  //         </span>
  //         Update Profile
  //       </button>
  //     </div>

  //     {/* Bottom Legal/Tip Blockquote Element */}
  //     <div className="bg-slate-50/60 border border-slate-100 rounded-xl p-3">
  //       <p className="text-[11px] text-slate-400 font-medium leading-relaxed flex gap-2">
  //         <span className="material-symbols-outlined text-primary text-[15px] shrink-0">
  //           info
  //         </span>
  //         Keep documents and experience up to date to significantly speed up
  //         background screening tasks.
  //       </p>
  //     </div>
  //   </div>
  // );
};
