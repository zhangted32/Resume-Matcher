'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useTranslations } from '@/lib/i18n';
import {
  fetchInterviewPreps,
  fetchJobs,
  fetchStarStories,
  fetchJobHistories,
  generateInterviewPrep,
  deleteInterviewPrep,
  type InterviewPrep,
  type JobHistory,
  type StarStory,
} from '@/lib/api';

import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Briefcase from 'lucide-react/dist/esm/icons/briefcase';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';

export default function InterviewPrepPage() {
  const { t } = useTranslations();
  const router = useRouter();
  const [preps, setPreps] = useState<InterviewPrep[]>([]);
  const [jobs, setJobs] = useState<{ job_id: string; content: string }[]>([]);
  const [starStories, setStarStories] = useState<StarStory[]>([]);
  const [jobHistories, setJobHistories] = useState<JobHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [prepToDelete, setPrepToDelete] = useState<string | null>(null);

  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [selectedStoryIds, setSelectedStoryIds] = useState<string[]>([]);
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);
  const [language, setLanguage] = useState<string>('en');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [prepsData, jobsData, storiesData, historiesData] = await Promise.all([
        fetchInterviewPreps(),
        fetchJobs(),
        fetchStarStories(),
        fetchJobHistories(),
      ]);
      setPreps(prepsData);
      setJobs(jobsData);
      setStarStories(storiesData);
      setJobHistories(historiesData);
      if (jobsData.length > 0) {
        setSelectedJobId(jobsData[0].job_id);
      }
    } catch (err) {
      setError(t('interviewPrep.interviewPrep.loadError'));
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedJobId) {
      setError(t('interviewPrep.interviewPrep.selectJob'));
      return;
    }
    try {
      setGenerating(true);
      setError(null);
      await generateInterviewPrep({
        job_id: selectedJobId,
        star_story_ids: selectedStoryIds.length > 0 ? selectedStoryIds : undefined,
        job_history_ids: selectedHistoryIds.length > 0 ? selectedHistoryIds : undefined,
        language,
      });
      await loadData();
    } catch (err) {
      setError(t('interviewPrep.interviewPrep.generateError'));
      console.error('Failed to generate interview prep:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!prepToDelete) return;
    try {
      await deleteInterviewPrep(prepToDelete);
      setIsDeleteDialogOpen(false);
      setPrepToDelete(null);
      await loadData();
    } catch (err) {
      setError(t('interviewPrep.interviewPrep.deleteError'));
      console.error('Failed to delete interview prep:', err);
    }
  };

  const openDeleteDialog = (prepId: string) => {
    setPrepToDelete(prepId);
    setIsDeleteDialogOpen(true);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  const toggleStorySelection = (storyId: string) => {
    setSelectedStoryIds((prev) =>
      prev.includes(storyId) ? prev.filter((id) => id !== storyId) : [...prev, storyId]
    );
  };

  const toggleHistorySelection = (historyId: string) => {
    setSelectedHistoryIds((prev) =>
      prev.includes(historyId) ? prev.filter((id) => id !== historyId) : [...prev, historyId]
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-6">
      {error && (
        <div className="border-2 border-red-600 bg-red-50 p-4">
          <p className="text-red-700 font-mono text-sm">{error}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-serif text-3xl font-semibold">
            {t('interviewPrep.interviewPrep.title')}
          </h1>
          <p className="text-sm text-steel-grey font-mono mt-1">
            {t('interviewPrep.interviewPrep.description')}
          </p>
        </div>
      </div>

      <Card variant="outline">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            {t('interviewPrep.interviewPrep.generate')}
          </CardTitle>
          <CardDescription>
            {t('interviewPrep.interviewPrep.generateDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="font-mono text-xs uppercase">
              {t('interviewPrep.interviewPrep.selectJob')} *
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {jobs.length === 0 ? (
                <div className="col-span-full text-center py-4 text-steel-grey">
                  {t('interviewPrep.interviewPrep.noJobs')}
                </div>
              ) : (
                jobs.map((job) => (
                  <button
                    key={job.job_id}
                    onClick={() => setSelectedJobId(job.job_id)}
                    className={`p-4 text-left border-2 transition-all ${
                      selectedJobId === job.job_id
                        ? 'border-blue-700 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{job.content.slice(0, 50)}...</div>
                    <div className="text-xs font-mono text-steel-grey mt-1">
                      {job.job_id.slice(0, 8)}...
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase">
                {t('interviewPrep.interviewPrep.selectStories')}
              </Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {starStories.length === 0 ? (
                  <div className="text-center py-4 text-steel-grey">
                    {t('interviewPrep.starStories.empty')}
                  </div>
                ) : (
                  starStories.map((story) => (
                    <button
                      key={story.story_id}
                      onClick={() => toggleStorySelection(story.story_id)}
                      className={`p-3 text-left border transition-all flex items-center justify-between ${
                        selectedStoryIds.includes(story.story_id)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium">{story.title}</span>
                      <span
                        className={`w-5 h-5 border-2 flex items-center justify-center ${
                          selectedStoryIds.includes(story.story_id)
                            ? 'border-purple-500 bg-purple-500 text-white'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedStoryIds.includes(story.story_id) ? '✓' : ''}
                      </span>
                    </button>
                  ))
                )}
              </div>
              <p className="text-xs text-steel-grey font-mono">
                {t('interviewPrep.interviewPrep.autoSelectHint')}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase">
                {t('interviewPrep.interviewPrep.selectHistories')}
              </Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {jobHistories.length === 0 ? (
                  <div className="text-center py-4 text-steel-grey">
                    {t('interviewPrep.jobHistories.empty')}
                  </div>
                ) : (
                  jobHistories.map((history) => (
                    <button
                      key={history.job_history_id}
                      onClick={() => toggleHistorySelection(history.job_history_id)}
                      className={`p-3 text-left border transition-all flex items-center justify-between ${
                        selectedHistoryIds.includes(history.job_history_id)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div>
                        <span className="font-medium">{history.role}</span>
                        <span className="text-xs text-steel-grey ml-2">{history.company}</span>
                      </div>
                      <span
                        className={`w-5 h-5 border-2 flex items-center justify-center ${
                          selectedHistoryIds.includes(history.job_history_id)
                            ? 'border-green-500 bg-green-500 text-white'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedHistoryIds.includes(history.job_history_id) ? '✓' : ''}
                      </span>
                    </button>
                  ))
                )}
              </div>
              <p className="text-xs text-steel-grey font-mono">
                {t('interviewPrep.interviewPrep.allHistoriesHint')}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleGenerate}
              disabled={generating || !selectedJobId}
              className="flex items-center gap-2"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
                  {t('common.generating')}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {t('interviewPrep.interviewPrep.generate')}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="font-serif text-2xl font-semibold mb-4">
          {t('interviewPrep.interviewPrep.previousPreps')}
        </h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : preps.length === 0 ? (
          <Card className="text-center py-12">
            <CardDescription className="text-lg">
              {t('interviewPrep.interviewPrep.noPreps')}
            </CardDescription>
            <Button onClick={() => {}} className="mt-4">
              <Plus className="w-4 h-4" />
              {t('interviewPrep.interviewPrep.generate')}
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {preps.map((prep) => (
              <Card key={prep.prep_id} variant="outline" className="relative">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-100 border-2 border-purple-700 flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-purple-700" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{prep.role_title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <span className="font-medium">{prep.company_name}</span>
                          <span className="text-steel-grey">|</span>
                          <span className="text-xs font-mono">{formatDate(prep.created_at)}</span>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/interview-prep/${prep.prep_id}`)}
                        className="flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        {t('interviewPrep.interviewPrep.view')}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(prep.prep_id)}
                        className="h-8 w-8 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      <span className="font-mono text-xs uppercase text-steel-grey">
                        {t('interviewPrep.interviewPrep.mockQA')}
                      </span>
                    </div>
                    <p className="font-serif text-sm">
                      {prep.mock_qa.length} {t('interviewPrep.interviewPrep.questions')}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-green-600" />
                      <span className="font-mono text-xs uppercase text-steel-grey">
                        {t('interviewPrep.interviewPrep.selfIntro')}
                      </span>
                    </div>
                    <p className="font-serif text-sm">
                      {prep.self_introduction.slice(0, 50)}...
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span className="font-mono text-xs uppercase text-steel-grey">
                        {t('interviewPrep.interviewPrep.questionsToAsk')}
                      </span>
                    </div>
                    <p className="font-serif text-sm">
                      {prep.questions_to_ask.length} {t('interviewPrep.interviewPrep.questions')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={t('interviewPrep.interviewPrep.deleteTitle')}
        description={t('interviewPrep.interviewPrep.deleteDescription')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleDelete}
        variant="danger"
      />
    </div>
  );
}
