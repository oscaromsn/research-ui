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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={editableTitle}
            onChange={e => handleTitleChange(e.target.value)}
            className="border-none bg-transparent font-semibold text-[#1a1f2e] text-lg focus:outline-none dark:text-white"
          />
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            className="rounded p-2 text-[#64748b] hover:bg-[#f1f5f9] dark:text-[#94a3b8] dark:hover:bg-[#242a3d]"
          >
            <Save size={16} />
          </button>
          <button
            type="button"
            className="rounded p-2 text-[#64748b] hover:bg-[#f1f5f9] dark:text-[#94a3b8] dark:hover:bg-[#242a3d]"
          >
            <Download size={16} />
          </button>
          <button
            type="button"
            className="rounded p-2 text-[#64748b] hover:bg-[#f1f5f9] dark:text-[#94a3b8] dark:hover:bg-[#242a3d]"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>
      <div className="flex space-x-4">
        <div className="w-64 flex-shrink-0 rounded-lg border border-[#e1e5eb] bg-white p-4 dark:border-[#2a3148] dark:bg-[#1e2436]">
          <h3 className="mb-3 font-medium text-[#2d3748] text-sm dark:text-[#e2e8f0]">
            Document Structure
          </h3>
          <div className="space-y-2">
            {defaultSections.map(sectionTitle => {
              const isComplete = getSectionCompletion(sectionTitle)
              return (
                <div
                  key={`section-${sectionTitle}`}
                  className={`cursor-pointer rounded p-2 text-xs ${
                    isComplete
                      ? 'bg-[#f1f5f9] text-[#3a7bb7] dark:bg-[#242a3d]'
                      : 'text-[#64748b] hover:bg-[#f8fafc] dark:text-[#94a3b8] dark:hover:bg-[#1a2234]'
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
        <div className="flex-grow rounded-lg border border-[#e1e5eb] bg-white p-4 dark:border-[#2a3148] dark:bg-[#1e2436]">
          <div className="dark:prose-invert prose prose-sm max-w-none">
            {report.executiveSummary && (
              <>
                <h2>Executive Summary</h2>
                <p>
                  {report.executiveSummary}
                  <span
                    className="ml-0.5 inline-block h-3 w-0.5 animate-caret-blink bg-[#4a5568] dark:bg-[#a0aec0]"
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
                      className="ml-0.5 inline-block h-3 w-0.5 animate-caret-blink bg-[#4a5568] dark:bg-[#a0aec0]"
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
                    className="ml-0.5 inline-block h-3 w-0.5 animate-caret-blink bg-[#4a5568] dark:bg-[#a0aec0]"
                    style={{ verticalAlign: 'text-top' }}
                  />
                </p>
              </>
            )}

            {!report.executiveSummary &&
              !report.sections.length &&
              !report.conclusion && (
                <div className="py-8 text-center text-[#64748b] dark:text-[#94a3b8]">
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
