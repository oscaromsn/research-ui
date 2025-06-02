'use client'

import { useAtomValue, useSetAtom } from 'jotai'
import { Download, FileText, Save, Share2 } from 'lucide-react'
import { useState } from 'react'

import { finalReportContentAtom } from '@/lib/state/researchAtoms'

export function ReportDrafter() {
  const report = useAtomValue(finalReportContentAtom)
  const setReport = useSetAtom(finalReportContentAtom)
  const [editableTitle, setEditableTitle] = useState(
    report.title || 'Untitled Report'
  )

  // Define default sections that we expect in reports
  const defaultSections = [
    'Executive Summary',
    'Background',
    'Legal Analysis',
    'Recommendations',
    'Conclusion',
  ]

  const handleTitleChange = (newTitle: string) => {
    setEditableTitle(newTitle)
    setReport(prev => ({ ...prev, title: newTitle }))
  }

  const getSectionCompletion = (sectionTitle: string): boolean => {
    // Check if section exists in report and has content
    const section = report.sections.find(s => s.title === sectionTitle)
    if (sectionTitle === 'Executive Summary') {
      return Boolean(
        report.executiveSummary && report.executiveSummary.trim().length > 0
      )
    }
    if (sectionTitle === 'Conclusion') {
      return Boolean(report.conclusion && report.conclusion.trim().length > 0)
    }
    return Boolean(section?.content && section.content.trim().length > 0)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={editableTitle}
            onChange={e => handleTitleChange(e.target.value)}
            className="bg-transparent border-none focus:outline-none font-semibold text-[#1a1f2e] dark:text-white text-lg"
          />
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            className="hover:bg-[#f1f5f9] dark:hover:bg-[#242a3d] p-2 rounded text-[#64748b] dark:text-[#94a3b8]"
          >
            <Save size={16} />
          </button>
          <button
            type="button"
            className="hover:bg-[#f1f5f9] dark:hover:bg-[#242a3d] p-2 rounded text-[#64748b] dark:text-[#94a3b8]"
          >
            <Download size={16} />
          </button>
          <button
            type="button"
            className="hover:bg-[#f1f5f9] dark:hover:bg-[#242a3d] p-2 rounded text-[#64748b] dark:text-[#94a3b8]"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>
      <div className="flex space-x-4">
        <div className="flex-shrink-0 bg-white dark:bg-[#1e2436] p-4 border border-[#e1e5eb] dark:border-[#2a3148] rounded-lg w-64">
          <h3 className="mb-3 font-medium text-[#2d3748] dark:text-[#e2e8f0] text-sm">
            Document Structure
          </h3>
          <div className="space-y-2">
            {defaultSections.map(sectionTitle => {
              const isComplete = getSectionCompletion(sectionTitle)
              return (
                <div
                  key={`section-${sectionTitle}`}
                  className={`p-2 text-xs rounded cursor-pointer ${
                    isComplete
                      ? 'bg-[#f1f5f9] dark:bg-[#242a3d] text-[#3a7bb7]'
                      : 'text-[#64748b] dark:text-[#94a3b8] hover:bg-[#f8fafc] dark:hover:bg-[#1a2234]'
                  }`}
                >
                  <div className="flex items-center">
                    <FileText size={12} className="mr-2" />
                    {sectionTitle}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="flex-grow bg-white dark:bg-[#1e2436] p-4 border border-[#e1e5eb] dark:border-[#2a3148] rounded-lg">
          <div className="dark:prose-invert max-w-none prose prose-sm">
            {report.executiveSummary && (
              <>
                <h2>Executive Summary</h2>
                <p>
                  {report.executiveSummary}
                  <span
                    className="inline-block bg-[#4a5568] dark:bg-[#a0aec0] w-0.5 h-3 ml-0.5 animate-caret-blink"
                    style={{ verticalAlign: 'text-top' }}
                  />
                </p>
              </>
            )}

            {report.sections
              .filter(
                section =>
                  section.title !== 'Executive Summary' &&
                  section.title !== 'Conclusion'
              )
              .map((section, index) => (
                <div key={section.title || `section-content-${index}`}>
                  <h2>{section.title}</h2>
                  <p>
                    {section.content}
                    <span
                      className="inline-block bg-[#4a5568] dark:bg-[#a0aec0] w-0.5 h-3 ml-0.5 animate-caret-blink"
                      style={{
                        verticalAlign: 'text-top',
                      }}
                    />
                  </p>
                </div>
              ))}

            {report.conclusion && (
              <>
                <h2>Conclusion</h2>
                <p>
                  {report.conclusion}
                  <span
                    className="inline-block bg-[#4a5568] dark:bg-[#a0aec0] w-0.5 h-3 ml-0.5 animate-caret-blink"
                    style={{ verticalAlign: 'text-top' }}
                  />
                </p>
              </>
            )}

            {!report.executiveSummary &&
              !report.sections.length &&
              !report.conclusion && (
                <div className="text-center text-[#64748b] dark:text-[#94a3b8] py-8">
                  <p>
                    Report content will appear here as analysis progresses...
                  </p>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  )
}
