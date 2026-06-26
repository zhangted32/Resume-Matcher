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
  fetchStarStories,
  createStarStory,
  updateStarStory,
  deleteStarStory,
  type StarStory,
  type StarStoryCreateRequest,
  type StarStoryUpdateRequest,
} from '@/lib/api';

import Plus from 'lucide-react/dist/esm/icons/plus';
import Edit2 from 'lucide-react/dist/esm/icons/edit-2';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import X from 'lucide-react/dist/esm/icons/x';
import Save from 'lucide-react/dist/esm/icons/save';

export default function StarStoriesPage() {
  const { t } = useTranslations();
  const [stories, setStories] = useState<StarStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<StarStory | null>(null);
  const [storyToDelete, setStoryToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState<StarStoryCreateRequest>({
    title: '',
    situation: '',
    task: '',
    action: '',
    result: '',
    tags: [],
  });

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchStarStories();
      setStories(data);
    } catch (err) {
      setError(t('interviewPrep.starStories.loadError'));
      console.error('Failed to load star stories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await createStarStory(formData);
      setIsCreateDialogOpen(false);
      setFormData({ title: '', situation: '', task: '', action: '', result: '', tags: [] });
      await loadStories();
    } catch (err) {
      setError(t('interviewPrep.starStories.createError'));
      console.error('Failed to create star story:', err);
    }
  };

  const handleUpdate = async () => {
    if (!editingStory) return;
    try {
      const updateData: StarStoryUpdateRequest = { ...formData };
      await updateStarStory(editingStory.story_id, updateData);
      setEditingStory(null);
      setFormData({ title: '', situation: '', task: '', action: '', result: '', tags: [] });
      await loadStories();
    } catch (err) {
      setError(t('interviewPrep.starStories.updateError'));
      console.error('Failed to update star story:', err);
    }
  };

  const handleDelete = async () => {
    if (!storyToDelete) return;
    try {
      await deleteStarStory(storyToDelete);
      setIsDeleteDialogOpen(false);
      setStoryToDelete(null);
      await loadStories();
    } catch (err) {
      setError(t('interviewPrep.starStories.deleteError'));
      console.error('Failed to delete star story:', err);
    }
  };

  const openEditDialog = (story: StarStory) => {
    setEditingStory(story);
    setFormData({
      title: story.title,
      situation: story.situation,
      task: story.task,
      action: story.action,
      result: story.result,
      tags: [...story.tags],
    });
  };

  const openDeleteDialog = (storyId: string) => {
    setStoryToDelete(storyId);
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
          <h1 className="font-serif text-3xl font-semibold">{t('interviewPrep.starStories.title')}</h1>
          <p className="text-sm text-steel-grey font-mono mt-1">
            {t('interviewPrep.starStories.description')}
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          {t('interviewPrep.starStories.create')}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : stories.length === 0 ? (
        <Card className="text-center py-12">
          <CardDescription className="text-lg">
            {t('interviewPrep.starStories.empty')}
          </CardDescription>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4">
            <Plus className="w-4 h-4" />
            {t('interviewPrep.starStories.create')}
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {stories.map((story) => (
            <Card key={story.story_id} variant="outline" className="relative">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{story.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-mono">{formatDate(story.updated_at)}</span>
                      {story.tags.length > 0 && (
                        <div className="flex gap-1">
                          {story.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-mono"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(story)}
                      className="h-8 w-8"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteDialog(story.story_id)}
                      className="h-8 w-8 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <Label className="font-mono text-xs uppercase text-steel-grey mb-1 block">
                    {t('interviewPrep.starStories.situation')}
                  </Label>
                  <p className="font-serif">{story.situation}</p>
                </div>
                <div>
                  <Label className="font-mono text-xs uppercase text-steel-grey mb-1 block">
                    {t('interviewPrep.starStories.task')}
                  </Label>
                  <p className="font-serif">{story.task}</p>
                </div>
                <div>
                  <Label className="font-mono text-xs uppercase text-steel-grey mb-1 block">
                    {t('interviewPrep.starStories.action')}
                  </Label>
                  <p className="font-serif">{story.action}</p>
                </div>
                <div>
                  <Label className="font-mono text-xs uppercase text-steel-grey mb-1 block">
                    {t('interviewPrep.starStories.result')}
                  </Label>
                  <p className="font-serif text-green-700">{story.result}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {(isCreateDialogOpen || editingStory) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex justify-between">
              <div>
                <CardTitle>
                  {editingStory
                    ? t('interviewPrep.starStories.edit')
                    : t('interviewPrep.starStories.create')}
                </CardTitle>
                <CardDescription>
                  {t('interviewPrep.starStories.formDescription')}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setEditingStory(null);
                  setFormData({ title: '', situation: '', task: '', action: '', result: '', tags: [] });
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase">{t('interviewPrep.starStories.title')}</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t('interviewPrep.starStories.titlePlaceholder')}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase">
                    {t('interviewPrep.starStories.situation')}
                  </Label>
                  <Textarea
                    value={formData.situation}
                    onChange={(e) => setFormData({ ...formData, situation: e.target.value })}
                    placeholder={t('interviewPrep.starStories.situationPlaceholder')}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase">
                    {t('interviewPrep.starStories.task')}
                  </Label>
                  <Textarea
                    value={formData.task}
                    onChange={(e) => setFormData({ ...formData, task: e.target.value })}
                    placeholder={t('interviewPrep.starStories.taskPlaceholder')}
                    rows={3}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase">
                    {t('interviewPrep.starStories.action')}
                  </Label>
                  <Textarea
                    value={formData.action}
                    onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                    placeholder={t('interviewPrep.starStories.actionPlaceholder')}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase">
                    {t('interviewPrep.starStories.result')}
                  </Label>
                  <Textarea
                    value={formData.result}
                    onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                    placeholder={t('interviewPrep.starStories.resultPlaceholder')}
                    rows={3}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase">
                  {t('interviewPrep.starStories.tags')}
                </Label>
                <Input
                  value={formData.tags?.join(', ') || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tags: e.target.value
                        .split(',')
                        .map((t) => t.trim())
                        .filter((t) => t),
                    })
                  }
                  placeholder={t('interviewPrep.starStories.tagsPlaceholder')}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setEditingStory(null);
                    setFormData({ title: '', situation: '', task: '', action: '', result: '', tags: [] });
                  }}
                >
                  {t('common.cancel')}
                </Button>
                <Button onClick={editingStory ? handleUpdate : handleCreate}>
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
        title={t('interviewPrep.starStories.deleteTitle')}
        description={t('interviewPrep.starStories.deleteDescription')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleDelete}
        variant="danger"
      />
    </div>
  );
}
