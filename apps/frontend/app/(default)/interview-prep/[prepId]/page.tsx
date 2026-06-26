'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useTranslations } from '@/lib/i18n';
import { fetchInterviewPrep, type InterviewPrep } from '@/lib/api';

import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import HelpCircle from 'lucide-react/dist/esm/icons/help-circle';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';

const categoryLabels: Record<string, string> = {
  role: 'Role',
  team: 'Team',
  company: 'Company',
  culture: 'Culture',
  growth: 'Growth',
};

const categoryColors: Record<string, string> = {
  role: 'bg-blue-100 text-blue-800',
  team: 'bg-green-100 text-green-800',
  company: 'bg-purple-100 text-purple-800',
  culture: 'bg-amber-100 text-amber-800',
  growth: 'bg-pink-100 text-pink-800',
};

const typeLabels: Record<string, string> = {
  behavioral: 'Behavioral',
  situational: 'Situational',
  technical: 'Technical',
  knowledge: 'Knowledge',
};

const typeColors: Record<string, string> = {
  behavioral: 'bg-blue-100 text-blue-800',
  situational: 'bg-amber-100 text-amber-800',
  technical: 'bg-green-100 text-green-800',
  knowledge: 'bg-purple-100 text-purple-800',
};

export default function InterviewPrepDetailPage() {
  const { t } = useTranslations();
  const params = useParams();
  const router = useRouter();
  const prepId = params.prepId as string;

  const [prep, setPrep] = useState<InterviewPrep | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPrep();
  }, [prepId]);

  const loadPrep = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchInterviewPrep(prepId);
      setPrep(data);
    } catch (err) {
      setError(t('interviewPrep.interviewPrep.loadError'));
      console.error('Failed to load interview prep:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestion = (index: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const scrollToSection = (section: string) => {
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !prep) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Button variant="outline" onClick={() => router.push('/interview-prep')}>
          <ArrowLeft className="w-4 h-4" />
          {t('common.back')}
        </Button>
        <Card className="mt-6 text-center py-12">
          <CardDescription className="text-lg">{error || t('interviewPrep.interviewPrep.notFound')}</CardDescription>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Button variant="outline" onClick={() => router.push('/interview-prep')} className="mb-6">
        <ArrowLeft className="w-4 h-4" />
        {t('common.back')}
      </Button>

      <Card variant="outline" className="mb-6">
        <CardHeader className="text-center pb-4">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 border-4 border-black mx-auto flex items-center justify-center mb-4">
            <span className="text-3xl font-serif font-bold text-white">
              {prep.company_name.charAt(0)}
            </span>
          </div>
          <CardTitle className="text-3xl">{prep.company_name}</CardTitle>
          <CardDescription className="text-xl mt-2">{prep.role_title}</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card variant="outline" className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">
                {t('interviewPrep.interviewPrep.tableOfContents')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button
                onClick={() => scrollToSection('mock-qa')}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span className="font-mono text-sm">
                  {t('interviewPrep.interviewPrep.mockQA')} ({prep.mock_qa.length})
                </span>
              </button>
              <button
                onClick={() => scrollToSection('self-intro')}
                className="w-full text-left px-3 py-2 hover:bg-green-50 transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-green-600" />
                <span className="font-mono text-sm">
                  {t('interviewPrep.interviewPrep.selfIntro')}
                </span>
              </button>
              <button
                onClick={() => scrollToSection('questions-to-ask')}
                className="w-full text-left px-3 py-2 hover:bg-amber-50 transition-colors flex items-center gap-2"
              >
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <span className="font-mono text-sm">
                  {t('interviewPrep.interviewPrep.questionsToAsk')} ({prep.questions_to_ask.length})
                </span>
              </button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div id="mock-qa">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              <h2 className="font-serif text-2xl font-semibold">
                {t('interviewPrep.interviewPrep.mockQA')}
              </h2>
            </div>
            <div className="space-y-4">
              {prep.mock_qa.map((qa, index) => {
                const isExpanded = expandedQuestions.has(`qa-${index}`);
                return (
                  <Card key={index} variant="outline">
                    <CardHeader className="cursor-pointer" onClick={() => toggleQuestion(`qa-${index}`)}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 text-xs font-mono ${typeColors[qa.type]}`}>
                              {typeLabels[qa.type]}
                            </span>
                            <span className="text-xs font-mono text-steel-grey">
                              Q{index + 1}
                            </span>
                          </div>
                          <CardTitle className="text-lg">{qa.question}</CardTitle>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-steel-grey" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-steel-grey" />
                        )}
                      </div>
                    </CardHeader>
                    {isExpanded && (
                      <CardContent className="pt-0">
                        <Label className="font-mono text-xs uppercase text-steel-grey mb-2 block">
                          {t('interviewPrep.interviewPrep.answer')}
                        </Label>
                        <div className="bg-blue-50 p-4 border-l-4 border-blue-500">
                          <p className="font-serif text-sm leading-relaxed whitespace-pre-line">
                            {qa.answer}
                          </p>
                        </div>
                        {qa.story_id && (
                          <div className="mt-3">
                            <Label className="font-mono text-xs uppercase text-steel-grey mb-1 block">
                              {t('interviewPrep.interviewPrep.sourceStory')}
                            </Label>
                            <span className="px-2 py-1 bg-purple-50 text-purple-800 text-xs font-mono">
                              {qa.story_id}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          <div id="self-intro">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-green-600" />
              <h2 className="font-serif text-2xl font-semibold">
                {t('interviewPrep.interviewPrep.selfIntro')}
              </h2>
            </div>
            <Card variant="outline">
              <CardContent className="bg-green-50 p-6">
                <p className="font-serif text-lg leading-relaxed whitespace-pre-line">
                  {prep.self_introduction}
                </p>
              </CardContent>
            </Card>
          </div>

          <div id="questions-to-ask">
            <div className="flex items-center gap-3 mb-4">
              <HelpCircle className="w-6 h-6 text-amber-600" />
              <h2 className="font-serif text-2xl font-semibold">
                {t('interviewPrep.interviewPrep.questionsToAsk')}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prep.questions_to_ask.map((item, index) => (
                <Card key={index} variant="outline">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-xs font-mono ${categoryColors[item.category]}`}>
                        {categoryLabels[item.category]}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{item.question}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Label className="font-mono text-xs uppercase text-steel-grey mb-1 block">
                      {t('interviewPrep.interviewPrep.rationale')}
                    </Label>
                    <p className="font-serif text-sm text-steel-grey">{item.rationale}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
