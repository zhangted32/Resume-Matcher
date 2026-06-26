'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useTranslations } from '@/lib/i18n';
import {
  fetchJobHistories,
  createJobHistory,
  updateJobHistory,
  deleteJobHistory,
  type JobHistory,
  type JobHistoryCreateRequest,
  type JobHistoryUpdateRequest,
} from '@/lib/api';

import Plus from 'lucide-react/dist/esm/icons/plus';
import Edit2 from 'lucide-react/dist/esm/icons/edit-2';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import X from 'lucide-react/dist/esm/icons/x';
import Save from 'lucide-react/dist/esm/icons/save';
import Briefcase from 'lucide-react/dist/esm/icons/briefcase';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';

export default function JobHistoriesPage() {
  const { t } = useTranslations();
  const [histories, setHistories] = useState<JobHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingHistory, setEditingHistory] = useState<JobHistory | null>(null);
  const [historyToDelete, setHistoryToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState<JobHistoryCreateRequest>({
    company: '',
    role: '',
    years: '',
    description: '',
    department: null,
    location: null,
    responsibilities: [],
    skills_used: [],
  });

  useEffect(() => {
    loadHistories();
  }, []);

  const loadHistories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchJobHistories();
      setHistories(data);
    } catch (err) {
      setError(t('interviewPrep.jobHistories.loadError'));
      console.error('Failed to load job histories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await createJobHistory(formData);
      setIsCreateDialogOpen(false);
      setFormData({ company: '', role: '', years: '', description: '', department: null, location: null, responsibilities: [], skills_used: [] });
      await loadHistories();
    } catch (err) {
      setError(t('interviewPrep.jobHistories.createError'));
      console.error('Failed to create job history:', err);
    }
  };

  const handleUpdate = async () => {
    if (!editingHistory) return;
    try {
      const updateData: JobHistoryUpdateRequest = { ...formData };
      await updateJobHistory(editingHistory.job_history_id, updateData);
      setEditingHistory(null);
      setFormData({ company: '', role: '', years: '', description: '', department: null, location: null, responsibilities: [], skills_used: [] });
      await loadHistories();
    } catch (err) {
      setError(t('interviewPrep.jobHistories.updateError'));
      console.error('Failed to update job history:', err);
    }
  };

  const handleDelete = async () => {
    if (!historyToDelete) return;
    try {
      await deleteJobHistory(historyToDelete);
      setIsDeleteDialogOpen(false);
      setHistoryToDelete(null);
      await loadHistories();
    } catch (err) {
      setError(t('interviewPrep.jobHistories.deleteError'));
      console.error('Failed to delete job history:', err);
    }
  };

  const openEditDialog = (history: JobHistory) => {
    setEditingHistory(history);
    setFormData({
      company: history.company,
      role: history.role,
      years: history.years,
      description: history.description,
      department: history.department,
      location: history.location,
      responsibilities: [...history.responsibilities],
      skills_used: [...history.skills_used],
    });
  };

  const openDeleteDialog = (jobHistoryId: string) => {
    setHistoryToDelete(jobHistoryId);
    setIsDeleteDialogOpen(true);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
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
          <h1 className="font-serif text-3xl font-semibold">{t('interviewPrep.jobHistories.title')}</h1>
          <p className="text-sm text-steel-grey font-mono mt-1">
            {t('interviewPrep.jobHistories.description')}
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          {t('interviewPrep.jobHistories.create')}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : histories.length === 0 ? (
        <Card className="text-center py-12">
          <CardDescription className="text-lg">
            {t('interviewPrep.jobHistories.empty')}
          </CardDescription>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4">
            <Plus className="w-4 h-4" />
            {t('interviewPrep.jobHistories.create')}
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {histories.map((history) => (
            <Card key={history.job_history_id} variant="outline" className="relative">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 border-2 border-blue-700 flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-blue-700" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{history.role}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <span className="font-medium">{history.company}</span>
                        <span className="text-steel-grey">|</span>
                        <span className="text-xs font-mono">{history.years}</span>
                        {history.location && (
                          <>
                            <span className="text-steel-grey">|</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {history.location}
                            </span>
                          </>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(history)}
                      className="h-8 w-8"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteDialog(history.job_history_id)}
                      className="h-8 w-8 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="font-mono text-xs uppercase text-steel-grey mb-1 block">
                    {t('interviewPrep.jobHistories.description')}
                  </Label>
                  <p className="font-serif">{history.description}</p>
                </div>
                {history.responsibilities.length > 0 && (
                  <div>
                    <Label className="font-mono text-xs uppercase text-steel-grey mb-2 block">
                      {t('interviewPrep.jobHistories.responsibilities')}
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {history.responsibilities.map((resp, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-800 text-sm font-mono"
                        >
                          {resp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {history.skills_used.length > 0 && (
                  <div>
                    <Label className="font-mono text-xs uppercase text-steel-grey mb-2 block">
                      {t('interviewPrep.jobHistories.skillsUsed')}
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {history.skills_used.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-green-50 border border-green-200 text-green-800 text-sm font-mono"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {history.star_stories.length > 0 && (
                  <div className="pt-2 border-t border-gray-200">
                    <Label className="font-mono text-xs uppercase text-steel-grey mb-2 block">
                      {t('interviewPrep.jobHistories.linkedStories')} ({history.star_stories.length})
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {history.star_stories.map((story) => (
                        <span
                          key={story.story_id}
                          className="px-2 py-1 bg-purple-50 border border-purple-200 text-purple-800 text-xs font-mono"
                        >
                          {story.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {(isCreateDialogOpen || editingHistory) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex justify-between">
              <div>
                <CardTitle>
                  {editingHistory
                    ? t('interviewPrep.jobHistories.edit')
                    : t('interviewPrep.jobHistories.create')}
                </CardTitle>
                <CardDescription>
                  {t('interviewPrep.jobHistories.formDescription')}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setEditingHistory(null);
                  setFormData({ company: '', role: '', years: '', description: '', department: null, location: null, responsibilities: [], skills_used: [] });
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase">
                    {t('interviewPrep.jobHistories.company')}
                  </Label>
                  <Input
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder={t('interviewPrep.jobHistories.companyPlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase">
                    {t('interviewPrep.jobHistories.role')}
                  </Label>
                  <Input
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder={t('interviewPrep.jobHistories.rolePlaceholder')}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase">
                    {t('interviewPrep.jobHistories.years')}
                  </Label>
                  <Input
                    value={formData.years}
                    onChange={(e) => setFormData({ ...formData, years: e.target.value })}
                    placeholder={t('interviewPrep.jobHistories.yearsPlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase">
                    {t('interviewPrep.jobHistories.location')}
                  </Label>
                  <Input
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value || null })}
                    placeholder={t('interviewPrep.jobHistories.locationPlaceholder')}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase">
                  {t('interviewPrep.jobHistories.description')}
                </Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('interviewPrep.jobHistories.descriptionPlaceholder')}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase">
                  {t('interviewPrep.jobHistories.responsibilities')}
                </Label>
                <Input
                  value={formData.responsibilities?.join(', ') || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      responsibilities: e.target.value
                        .split(',')
                        .map((r) => r.trim())
                        .filter((r) => r),
                    })
                  }
                  placeholder={t('interviewPrep.jobHistories.responsibilitiesPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase">
                  {t('interviewPrep.jobHistories.skillsUsed')}
                </Label>
                <Input
                  value={formData.skills_used?.join(', ') || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      skills_used: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter((s) => s),
                    })
                  }
                  placeholder={t('interviewPrep.jobHistories.skillsUsedPlaceholder')}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setEditingHistory(null);
                    setFormData({ company: '', role: '', years: '', description: '', department: null, location: null, responsibilities: [], skills_used: [] });
                  }}
                >
                  {t('common.cancel')}
                </Button>
                <Button onClick={editingHistory ? handleUpdate : handleCreate}>
                  <Save className="w-4 h-4" />
                  {t('common.save')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={t('interviewPrep.jobHistories.deleteTitle')}
        description={t('interviewPrep.jobHistories.deleteDescription')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleDelete}
        variant="danger"
      />
    </div>
  );
}
