"use client";

import { useState, useEffect, useRef, DragEvent } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PlusIcon, X, UploadCloud } from "lucide-react";
import { MultiSelect, OptionType } from "@/components/ui/multi-select";

interface EditablePost {
  id: string;
  title: string;
  description?: string;
  body: string;
  status?: string;
  categories?: { id: string; name: string }[] | string[];
  tags?: { id: string; name: string }[] | string[];
  preview_url?: string;
}

const API_BASE_URL = "http://localhost:3001/api/v1/private";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  postToEdit?: EditablePost | null;
}

export function CreatePostDialog({
  open,
  onOpenChange,
  onSuccess,
  postToEdit,
}: CreatePostDialogProps) {
  const isEditMode = !!postToEdit;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState(postToEdit?.status || "draft");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [removeOriginalImage, setRemoveOriginalImage] = useState(false); // Новый флаг
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [availableCategories, setAvailableCategories] = useState<OptionType[]>([]);
  const [availableTags, setAvailableTags] = useState<OptionType[]>([]);

  useEffect(() => {
    if (isEditMode && postToEdit && open) {
      setTitle(postToEdit.title || "");
      setDescription(postToEdit.description || "");
      setBody(postToEdit.body || "");
      setStatus(postToEdit.status || "draft");

      const mapIds = (items?: { id: string; name: string }[] | string[]): string[] => {
        if (!items) return [];
        return items.map(item => (typeof item === 'string' ? item : item.id));
      };
      setSelectedCategories(mapIds(postToEdit.categories));
      setSelectedTags(mapIds(postToEdit.tags));

      setImagePreviewUrl(postToEdit.preview_url || null);
      setSelectedImage(null);
      setRemoveOriginalImage(false); // Сброс флага при загрузке данных для редактирования
    } else if (!isEditMode && open) {
      // Сброс формы для нового поста
      setTitle("");
      setDescription("");
      setBody("");
      setStatus("draft");
      setSelectedCategories([]);
      setSelectedTags([]);
      setSelectedImage(null);
      setImagePreviewUrl(null);
      setRemoveOriginalImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [postToEdit, isEditMode, open]);


  useEffect(() => {
    const fetchData = async () => {
      // ... (логика загрузки категорий и тегов без изменений) ...
      if (!open) return;
      setIsSubmitting(true); // Show loading for categories/tags
      try {
        const catResponse = await fetch(`${API_BASE_URL}/categories`, { credentials: 'include' });
        const tagResponse = await fetch(`${API_BASE_URL}/tags`, { credentials: 'include' });

        if (catResponse.ok) {
          const catData = await catResponse.json();
          const categoriesFromServer = Array.isArray(catData.content?.categories) ? catData.content.categories : [];
          setAvailableCategories(categoriesFromServer.map((c: any) => ({ id: c.id, name: c.name })));
        } else {
          setAvailableCategories([]);
          toast.error("Ошибка", { description: "Не удалось загрузить категории" });
        }

        if (tagResponse.ok) {
          const tagData = await tagResponse.json();
          const tagsFromServer = Array.isArray(tagData.content?.tags) ? tagData.content.tags : [];
          setAvailableTags(tagsFromServer.map((t: any) => ({ id: t.id, name: t.name })));
        } else {
          setAvailableTags([]);
          toast.error("Ошибка", { description: "Не удалось загрузить теги" });
        }
      } catch (error) {
        toast.error("Ошибка сети", { description: "Не удалось загрузить справочники." });
      } finally {
        setIsSubmitting(false); // Hide loading
      }
    };
    fetchData();
  }, [open]);

  const processFile = (file: File | null) => {
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file); // Новое изображение выбрано
      const objectUrl = URL.createObjectURL(file);
      setImagePreviewUrl(objectUrl); // Показываем превью нового изображения
      setRemoveOriginalImage(false); // Если выбрано новое изображение, мы заменяем, а не просто удаляем старое
    } else if (file) {
      toast.error("Неверный тип файла", { description: "Пожалуйста, выберите изображение (PNG, JPG, GIF)." });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFile(e.target.files && e.target.files[0]);
  };

  const clearSelectedImage = () => { // Кнопка "X" для удаления превью
    // Если было выбрано новое изображение (blob URL), отзываем его
    if (selectedImage && imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setSelectedImage(null); // Теперь нет выбранного *нового* файла

    // Если мы в режиме редактирования и у поста было оригинальное изображение
    if (isEditMode && postToEdit?.preview_url) {
      // Если текущее превью было оригинальным изображением ИЛИ мы только что очистили новое выбранное изображение,
      // то нажатие "X" теперь означает, что мы хотим удалить оригинальное изображение с сервера.
      setImagePreviewUrl(null); // Очищаем превью
      setRemoveOriginalImage(true); // Помечаем оригинальное изображение для удаления
    } else {
      // Не в режиме редактирования, или не было оригинального изображения
      setImagePreviewUrl(null);
      setRemoveOriginalImage(false);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

   useEffect(() => {
    // Очистка blob URL при размонтировании или изменении imagePreviewUrl/selectedImage
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:') && selectedImage) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl, selectedImage]);


  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
      if (e.dataTransfer.items) e.dataTransfer.items.clear();
      else e.dataTransfer.clearData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
        toast.error("Ошибка валидации", { description: "Заголовок поста не может быть пустым." });
        return;
    }
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("body", body);
    formData.append("status", status);

    selectedCategories.forEach(categoryId => formData.append("categories[]", categoryId));
    selectedTags.forEach(tagId => formData.append("tags[]", tagId));

    if (selectedImage) { // Если выбрано новое изображение
      formData.append("image", selectedImage);
    } else if (isEditMode && removeOriginalImage) { // Если нового нет, но оригинальное помечено к удалению
      formData.append("remove_preview_image", "true");
    }
    // Если ни одно из вышеперечисленных, поля, связанные с изображением, не отправляются.
    // Бэкенд должен сохранить существующее изображение, если это режим редактирования.

    const url = isEditMode ? `${API_BASE_URL}/posts/${postToEdit!.id}` : `${API_BASE_URL}/posts`;
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: { message: `Не удалось ${isEditMode ? 'обновить' : 'создать'} пост. Статус: ${response.status}` }
        }));
        throw new Error(errorData.error?.message || `Ошибка ${isEditMode ? 'обновления' : 'создания'} поста`);
      }

      // Сброс полей формы после успешной отправки
      setTitle("");
      setDescription("");
      setBody("");
      setSelectedCategories([]);
      setSelectedTags([]);
      setSelectedImage(null);
      setImagePreviewUrl(null);
      setRemoveOriginalImage(false); // Сброс флага
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      onOpenChange(false);

      toast.success(isEditMode ? "Пост обновлен" : "Пост создан", {
        description: `Ваш пост был успешно ${isEditMode ? 'обновлен' : 'опубликован'}`
      });

      if (onSuccess) onSuccess();

    } catch (error: any) {
      console.error(`Ошибка при ${isEditMode ? 'обновлении' : 'создании'} поста:`, error);
      toast.error(`Ошибка ${isEditMode ? 'обновления' : 'создания'} поста`, {
        description: error.message || "Произошла неизвестная ошибка"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) { // Если диалог закрывается (не через успешный submit)
        // Сбрасываем состояние изображения, чтобы избежать проблем при следующем открытии
        setSelectedImage(null);
        setImagePreviewUrl(postToEdit && isEditMode ? postToEdit.preview_url || null : null); // Восстанавливаем исходное превью или null
        setRemoveOriginalImage(false);
        // Остальные поля формы будут сброшены или переинициализированы через useEffect при следующем открытии
      }
    }}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogTitle>{isEditMode ? "Редактировать пост" : "Создание нового поста"}</DialogTitle>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 max-h-[80vh] overflow-y-auto px-2">
          {/* ... (поля формы: title, description, body, image upload, categories, tags) ... */}
          <div className="grid gap-2">
            <Label htmlFor="title">Заголовок <span className="text-destructive">*</span></Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите заголовок поста"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">Краткое описание (необязательно)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Введите краткое описание поста"
              rows={2}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="body">Содержание поста (необязательно)</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Введите содержание поста."
              rows={8}
              className="font-mono text-sm shadow-none"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="image-upload-dnd">Изображение для превью (необязательно)</Label>
            {!imagePreviewUrl ? (
              <div
                id="image-upload-dnd"
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer
                            transition-colors duration-200 ease-in-out
                            ${isDragging 
                              ? 'border-primary dark:border-primary bg-primary/5 dark:bg-primary/10' 
                              : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                            }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className={`w-8 h-8 mb-2 ${isDragging ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`} />
                  <p className={`mb-1 text-sm ${isDragging ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span className="font-semibold">Нажмите для загрузки</span> или перетащите
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF</p>
                </div>
                <Input 
                  id="image-upload-input"
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange}
                  ref={fileInputRef}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="mt-2 relative">
                <img src={imagePreviewUrl} alt="Предпросмотр" className="max-h-40 w-auto rounded-md" />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-1 right-1 bg-background/70 hover:bg-background/90 h-6 w-6 rounded-full"
                  onClick={clearSelectedImage}
                  title="Удалить изображение"
                >
                  <X size={14} />
                </Button>
              </div>
            )}
          </div>
          
          <div className="grid gap-2">
            <Label>Категории (необязательно)</Label>
            <MultiSelect 
              options={availableCategories}
              selected={selectedCategories}
              onChange={setSelectedCategories}
              placeholder="Выберите категории..."
              className="shadow-none"
            />
          </div>
          
          <div className="grid gap-2">
            <Label>Теги (необязательно)</Label>
            <MultiSelect 
              options={availableTags}
              selected={selectedTags}
              onChange={setSelectedTags}
              placeholder="Выберите теги..."
              className="shadow-none"
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim()} className="shadow-none">
              {isEditMode 
                ? (isSubmitting ? "Сохранение..." : "Сохранить изменения")
                : (isSubmitting ? "Публикация..." : "Опубликовать")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}