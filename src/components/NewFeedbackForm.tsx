import { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  RefreshCw,
  Edit,
  Paperclip,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { extractFeedbackDetails, extractFeedbackFromFile, isAIEnabled, type ExtractedFeedback } from '../lib/openaiClient';
import { createRequest } from '../services/dataService';

interface NewFeedbackFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewFeedbackForm({ onClose, onSuccess }: NewFeedbackFormProps) {
  const [requesterName, setRequesterName] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [requesterDepartment, setRequesterDepartment] = useState('');
  const [feedback, setFeedback] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const [aiExtracted, setAiExtracted] = useState<ExtractedFeedback | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [showAIDetails, setShowAIDetails] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [aiError, setAiError] = useState(false);

  const [manualCategory, setManualCategory] = useState('');
  const [manualPriority, setManualPriority] = useState('medium');
  const [manualStatus, setManualStatus] = useState('new');
  const [manualOwner, setManualOwner] = useState('');
  const [manualDueDate, setManualDueDate] = useState('');
  const [manualTags, setManualTags] = useState('');
  const [manualSource, setManualSource] = useState('manual');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const extractionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (feedback.length > 50 && isAIEnabled && !showAdvanced) {
      if (extractionTimeoutRef.current) {
        clearTimeout(extractionTimeoutRef.current);
      }

      extractionTimeoutRef.current = setTimeout(() => {
        handleAIExtraction();
      }, 2000);
    }

    return () => {
      if (extractionTimeoutRef.current) {
        clearTimeout(extractionTimeoutRef.current);
      }
    };
  }, [feedback]);

  const handleAIExtraction = async () => {
    if (!feedback.trim() || feedback.length < 50) return;

    setIsExtracting(true);
    setAiError(false);

    try {
      const extracted = await extractFeedbackDetails(feedback);
      if (extracted) {
        setAiExtracted(extracted);
        setShowAIDetails(true);
        setAiError(false);
      } else {
        setAiError(true);
      }
    } catch (error) {
      console.error('AI extraction error:', error);
      setAiError(true);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setAttachedFile(file);
      setError('');
      setFeedback('');

      setIsExtracting(true);
      setAiError(false);
      setShowAIDetails(true);

      try {
        const extracted = await extractFeedbackFromFile(file);
        if (extracted) {
          setAiExtracted(extracted);
          if (extracted.extractedText) {
            setFeedback(extracted.extractedText);
          }
          setAiError(false);
        } else {
          setAiError(true);
        }
      } catch (error) {
        console.error('File extraction error:', error);
        setAiError(true);
      } finally {
        setIsExtracting(false);
      }
    }
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!requesterName.trim()) {
      setError('Requester name is required');
      return;
    }

    if (!attachedFile && (!feedback.trim() || feedback.length < 10)) {
      setError('Please provide feedback text or upload a file');
      return;
    }

    if (attachedFile && !aiExtracted) {
      setError('Please wait for file processing to complete');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const category = showAdvanced ? manualCategory : aiExtracted?.category || '';
      const priority = showAdvanced ? manualPriority : aiExtracted?.priority || 'medium';
      const description = showAdvanced ? '' : aiExtracted?.description || '';
      const tags = showAdvanced
        ? manualTags.split(',').map((t) => t.trim()).filter(Boolean)
        : aiExtracted?.tags || [];
      const suggestedOwner = showAdvanced ? '' : aiExtracted?.suggestedOwner || '';

      const attachments = attachedFile
        ? {
            fileName: attachedFile.name,
            fileSize: attachedFile.size,
            fileType: attachedFile.type,
          }
        : null;

      await createRequest({
        requester_name: requesterName.trim(),
        requester_email: requesterEmail.trim() || undefined,
        requester_department: requesterDepartment.trim() || undefined,
        raw_feedback: feedback.trim(),
        description: description || undefined,
        category: category || undefined,
        priority,
        status: isDraft ? 'draft' : (showAdvanced ? manualStatus : 'in_progress'),
        source: showAdvanced ? manualSource : 'manual',
        suggested_owner: suggestedOwner || undefined,
        due_date: showAdvanced && manualDueDate ? manualDueDate : undefined,
        tags: tags.length > 0 ? tags : undefined,
        attachments: attachments || undefined,
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating request:', err);
      setError('Failed to create request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    'Policy Question',
    'Complaint',
    'Suggestion',
    'Information Request',
    'Escalation',
    'Benefits Question',
    'General',
    'Other',
  ];

  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return 'bg-red-100 text-red-700 border-red-300';
    if (priority === 'medium') return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-green-100 text-green-700 border-green-300';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Policy Question': 'bg-purple-100 text-purple-700',
      Complaint: 'bg-red-100 text-red-700',
      Suggestion: 'bg-green-100 text-green-700',
      'Information Request': 'bg-blue-100 text-blue-700',
      Escalation: 'bg-orange-100 text-orange-700',
      'Benefits Question': 'bg-cyan-100 text-cyan-700',
      General: 'bg-gray-100 text-gray-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Liquid glass modal container */}
      <div
        className="
          max-w-3xl w-full rounded-2xl relative
          bg-white/30 backdrop-blur-xl
          border border-white/30
          shadow-[0_10px_40px_rgba(2,6,23,0.08)]
          max-h-[90vh] overflow-y-auto
        "
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/30 backdrop-blur-md border-b border-white/30 px-6 py-4 flex items-center justify-between z-20 rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 drop-shadow-sm">Submit New Feedback</h2>
            <p className="text-sm text-gray-700/90 mt-1">
              AI-assisted categorization and prioritization — submit feedback, get actions.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/40 transition-colors text-gray-700"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 bg-white/30 backdrop-blur-md border border-white/30">

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Requester Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                placeholder="e.g., John Smith"
                className="
                  w-full px-4 py-2 rounded-lg
                  bg-white/30 border border-white/30
                  backdrop-blur-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                "
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Requester Email
                </label>
                <input
                  type="email"
                  value={requesterEmail}
                  onChange={(e) => setRequesterEmail(e.target.value)}
                  placeholder="john.smith@company.com"
                  className="
                    w-full px-4 py-2 rounded-lg
                    bg-white/30 border border-white/30
                    backdrop-blur-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                  "
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">Department</label>
                <input
                  type="text"
                  value={requesterDepartment}
                  onChange={(e) => setRequesterDepartment(e.target.value)}
                  placeholder="e.g., Engineering"
                  className="
                    w-full px-4 py-2 rounded-lg
                    bg-white/30 border border-white/30
                    backdrop-blur-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                  "
                />
              </div>
            </div>

            <div>
              <input
                type="file"
                id="file-upload"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              />
              <label
                htmlFor="file-upload"
                className="
                  inline-flex items-center gap-2 px-4 py-2 rounded-lg
                  border border-white/30 bg-white/30 backdrop-blur-sm
                  hover:bg-white/35 cursor-pointer transition-colors
                "
              >
                <Paperclip className="w-4 h-4 text-gray-700" />
                <span className="text-sm text-gray-800">Upload feedback document</span>
              </label>
              {attachedFile && (
                <div className="mt-2 flex items-center gap-3 text-sm text-gray-700">
                  <div className="flex-1">
                    <div className="font-medium">{attachedFile.name}</div>
                    <div className="text-xs text-gray-500">({(attachedFile.size / 1024).toFixed(1)} KB)</div>
                  </div>
                  <button
                    onClick={() => {
                      setAttachedFile(null);
                      setFeedback('');
                      setAiExtracted(null);
                      setShowAIDetails(false);
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-600 mt-2">Max 10MB. PDF, DOC, TXT, or images. AI will extract feedback automatically.</p>
            </div>

            {!attachedFile && (
              <div className="flex items-center gap-4 my-2">
                <div className="flex-1 h-px bg-white/30" />
                <span className="text-sm text-gray-600">OR</span>
                <div className="flex-1 h-px bg-white/30" />
              </div>
            )}

            {!attachedFile && (
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Feedback <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Describe the feedback in your own words... Our AI will automatically extract the category, priority, and details."
                  rows={5}
                  maxLength={5000}
                  className="
                    w-full px-4 py-2 rounded-lg resize-y
                    bg-white/30 border border-white/30
                    backdrop-blur-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                  "
                  required
                />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-600">{feedback.length}/5000 characters</span>
                  {isAIEnabled && feedback.length > 50 && !showAdvanced && (
                    <span className="text-xs text-blue-600">AI will analyze after you stop typing...</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* AI Extracted details (glass panel) */}
          {isAIEnabled && !showAdvanced && (
            <div className="rounded-xl overflow-hidden border border-white/30 bg-white/30 backdrop-blur-md">
              <button
                onClick={() => setShowAIDetails(!showAIDetails)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/35 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">AI Extracted Details</span>
                  {isExtracting && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
                </div>
                {showAIDetails ? <ChevronUp className="w-5 h-5 text-gray-600" /> : <ChevronDown className="w-5 h-5 text-gray-600" />}
              </button>

              {showAIDetails && (
                <div className="px-4 pb-4 space-y-4">
                  {isExtracting && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>AI is analyzing your feedback...</span>
                    </div>
                  )}

                  {aiError && (
                    <div className="p-3 bg-yellow-50/80 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                      AI extraction unavailable. Please fill manually or try again.
                    </div>
                  )}

                  {aiExtracted && !isExtracting && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                        <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getCategoryColor(aiExtracted.category)}`}>
                          {aiExtracted.category}
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                        <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full border ${getPriorityColor(aiExtracted.priority)}`}>
                          {aiExtracted.priority.charAt(0).toUpperCase() + aiExtracted.priority.slice(1)}
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Clean Description</label>
                        <p className="text-sm text-gray-800 bg-white/30 p-3 rounded">{aiExtracted.description}</p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Suggested Tags</label>
                        <div className="flex flex-wrap gap-2">
                          {aiExtracted.tags.map((tag, index) => (
                            <span key={index} className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full">{tag}</span>
                          ))}
                        </div>
                      </div>

                      {aiExtracted.suggestedOwner && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Suggested Owner</label>
                          <span className="text-sm text-gray-800">{aiExtracted.suggestedOwner}</span>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleAIExtraction}
                          disabled={isExtracting}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-white/40 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Re-analyze
                        </button>
                        <button
                          onClick={() => setShowAdvanced(true)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-white/40 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Edit Manually
                        </button>
                      </div>
                    </div>
                  )}

                  {!aiExtracted && !isExtracting && !aiError && (
                    <p className="text-sm text-gray-600">Type at least 50 characters to see AI analysis.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Advanced options (glass card) */}
          {(showAdvanced || aiError || !isAIEnabled) && (
            <div className="rounded-xl border border-white/30 bg-white/30 backdrop-blur-md p-4 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Advanced Options</h3>
                {showAdvanced && isAIEnabled && (
                  <button onClick={() => setShowAdvanced(false)} className="text-sm text-gray-700 hover:text-gray-900">
                    Hide
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">Category</label>
                  <select
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value)}
                    className="
                      w-full px-4 py-2 rounded-lg
                      bg-white/30 border border-white/30
                      backdrop-blur-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                    "
                  >
                    <option value="">Select category...</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">Priority</label>
                  <select
                    value={manualPriority}
                    onChange={(e) => setManualPriority(e.target.value)}
                    className="
                      w-full px-4 py-2 rounded-lg
                      bg-white/30 border border-white/30
                      backdrop-blur-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                    "
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">Status</label>
                  <select
                    value={manualStatus}
                    onChange={(e) => setManualStatus(e.target.value)}
                    className="
                      w-full px-4 py-2 rounded-lg
                      bg-white/30 border border-white/30
                      backdrop-blur-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                    "
                  >
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">Source</label>
                  <select
                    value={manualSource}
                    onChange={(e) => setManualSource(e.target.value)}
                    className="
                      w-full px-4 py-2 rounded-lg
                      bg-white/30 border border-white/30
                      backdrop-blur-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                    "
                  >
                    <option value="manual">Manual</option>
                    <option value="email">Email</option>
                    <option value="slack">Slack</option>
                    <option value="teams">Teams</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={manualDueDate}
                    onChange={(e) => setManualDueDate(e.target.value)}
                    className="
                      w-full px-4 py-2 rounded-lg
                      bg-white/30 border border-white/30
                      backdrop-blur-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                    "
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-800 mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={manualTags}
                    onChange={(e) => setManualTags(e.target.value)}
                    placeholder="tag1, tag2, tag3"
                    className="
                      w-full px-4 py-2 rounded-lg
                      bg-white/30 border border-white/30
                      backdrop-blur-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                    "
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50/80 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}
        </div>

        {/* Sticky footer actions — glass style */}
        <div className="sticky bottom-0 bg-white/30 backdrop-blur-md border-t border-white/30 px-6 py-4 flex items-center justify-between rounded-b-2xl z-10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-800 hover:text-gray-900 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
              className="
                px-6 py-2 rounded-lg
                border border-white/30
                text-gray-800
                bg-white/30 backdrop-blur-sm
                hover:bg-white/35 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              Save as Draft
            </button>
            <button
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className="
                px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
