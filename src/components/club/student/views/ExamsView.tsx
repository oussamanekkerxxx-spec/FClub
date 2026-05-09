


export function ExamsView() {
  const EXAMS = [
    {
      subject: 'Algorithms & Data Structures',
      school: 'ENSIAS',
      year: '2024',
      professor: 'Pr. M. Alaoui',
      pages: 8,
      hasSolutions: true,
    },
    {
      subject: 'Web Technologies & Architecture',
      school: 'ENSA Rabat',
      year: '2023',
      professor: 'Pr. S. Chafik',
      pages: 6,
      hasSolutions: false,
    },
    {
      subject: 'Database Systems — Final',
      school: 'FSR',
      year: '2024',
      professor: 'Pr. K. Benbrahim',
      pages: 10,
      hasSolutions: true,
    },
  ];
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {EXAMS.map((e, i) => (
          <div key={i} className="bg-white border border-[var(--color-border)] rounded-2xl p-5 hover:border-orange-200 hover:-translate-y-0.5 hover:shadow-sm transition-all cursor-pointer group">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center text-[22px] flex-shrink-0">📝</div>
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-navy group-hover:text-[var(--color-amber)] transition-colors leading-snug">{e.subject}</div>
                <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{e.school} · {e.year} · {e.professor}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] font-bold px-2 py-0.5 bg-gray-50 border border-[var(--color-border)] text-[var(--color-text-muted)] rounded-full">{e.pages} pages</span>
              <span className="text-[9px] font-bold px-2 py-0.5 bg-red-50 border border-red-200 text-red-500 rounded-full">PDF</span>
              {e.hasSolutions && (
                <span className="text-[9px] font-bold px-2 py-0.5 bg-green-50 border border-green-200 text-green-600 rounded-full">✓ Solutions</span>
              )}
            </div>
            <button className="mt-4 w-full py-2 bg-gray-50 border border-[var(--color-border)] text-navy text-[12px] font-semibold rounded-xl group-hover:bg-parchment group-hover:border-orange-200 transition-colors">Download Exam</button>
          </div>
        ))}
      </div>
    </div>
  );
}
