"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PlusIcon, ImageIcon, Upload, X, ImagePlus, Loader2 } from "lucide-react";
import { MultiSelect } from "@/components/ui/multi-select";

interface CreatePostDialogProps {
  onPostCreated?: () => void;
}

export function CreatePostDialog({ onPostCreated }: CreatePostDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const status = "published"; // Всегда будет опубликовано
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Для загрузки файла
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Новые состояния для работы с редактором
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  // Примерные данные (в реальном приложении должны приходить с бэкенда)
  const categories = [
    { id: "category-id-1", name: "Новости" },
    { id: "category-id-2", name: "События" },
    { id: "category-id-3", name: "Технологии" }
  ];

  const tags = [
    { id: "tag-id-1", name: "Важное" },
    { id: "tag-id-2", name: "Обновление" },
    { id: "tag-id-3", name: "Релиз" }
  ];

  // Обработчик выбора файла
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);

      // Создаем URL для предпросмотра
      const objectUrl = URL.createObjectURL(file);
      setImagePreviewUrl(objectUrl);
    }
  };

  // Удаление выбранного изображения
  const clearSelectedImage = () => {
    setSelectedImage(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Очистка при закрытии
  useEffect(() => {
    if (!open && imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
      setSelectedImage(null);
    }
  }, [open, imagePreviewUrl]);

  // Функция для сохранения позиции курсора
  const saveCursorPosition = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
  };

  // Функция загрузки изображения внутрь текста
  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setIsUploading(true);

    try {
      // Создаём FormData для загрузки файла
      const imageFormData = new FormData();
      imageFormData.append("image", file);

      // Имитация запроса к серверу
      // В реальном приложении здесь будет fetch запрос к API
      console.log("Загрузка изображения...", file.name);

      // Имитация задержки и ответа от сервера
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockResponse = { 
        success: true, 
        imagePath: `/uploads/${file.name.replace(/\s+/g, '_')}` 
      };

      // Добавляем Markdown с изображением в текст на позиции курсора
      insertImageMarkdown(mockResponse.imagePath);

      // Сбросить input file
      e.target.value = '';

    } catch (error) {
      console.error("Ошибка при загрузке изображения:", error);
      alert("Не удалось загрузить изображение");
    } finally {
      setIsUploading(false);
    }
  };

  // Функция для вставки Markdown разметки с изображением
  const insertImageMarkdown = (imagePath: string) => {
    if (!textareaRef.current) return;

    const markdownImage = `\n![Изображение](${imagePath})\n`;
    const currentText = body;
    const newText = currentText.substring(0, cursorPosition) + markdownImage + currentText.substring(cursorPosition);

    setBody(newText);

    // После вставки изображения, установим курсор после вставленного Markdown
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = cursorPosition + markdownImage.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPosition, newPosition);
        setCursorPosition(newPosition);
      }
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Создаем FormData для отправки файла и данных
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("body", body);
      formData.append("status", status);

      // Добавляем категории и теги
      selectedCategories.forEach(categoryId => {
        formData.append("categories[]", categoryId);
      });

      selectedTags.forEach(tagId => {
        formData.append("tags[]", tagId);
      });

      // Добавляем файл изображения, если он выбран
      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      console.log("Отправка данных с изображением...");
      // Обычный console.log не отобразит содержимое FormData
      // поэтому показываем отдельные поля для отладки
      for (const [key, value] of formData.entries()) {
        console.log(`${key}: ${value instanceof File ? `File: ${value.name}` : value}`);
      }

      // Здесь будет запрос к API для создания поста
      // const response = await fetch('/api/posts', {
      //   method: 'POST',
      //   body: formData, // Отправляем FormData вместо JSON
      // });

      // Очищаем форму после успешного создания
      setTitle("");
      setDescription("");
      setBody("");
      setSelectedCategories([]);
      setSelectedTags([]);
      clearSelectedImage();
      setOpen(false);

      toast.success("Пост создан", {
        description: "Ваш пост был успешно опубликован"
      });

      if (onPostCreated) onPostCreated();

    } catch (error) {
      console.error("Ошибка при создании поста:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="default" 
          size="default"
          className="shadow-none flex items-center gap-1"
        >
          <PlusIcon size={16} />
          Создать пост
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogTitle>Создание нового поста</DialogTitle>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Заголовок</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите заголовок поста"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">Краткое описание</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Введите краткое описание поста"
              rows={2}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="image">Изображение</Label>
            
            {!imagePreviewUrl ? (
              <div className="relative border-2 border-dashed rounded-md p-6 flex flex-col items-center">
                <Input
                  ref={fileInputRef}
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center pointer-events-none">
                  <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Перетащите изображение или нажмите для выбора
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, GIF до 5MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative border rounded-md overflow-hidden">
                <div className="absolute top-2 right-2 z-10">
                  <Button
                    type="button" 
                    variant="destructive"
                    size="icon"
                    onClick={clearSelectedImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="h-[200px] w-full">
                  <img
                    src={imagePreviewUrl}
                    alt="Превью изображения"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="p-2 bg-muted/20">
                    <p className="text-xs truncate">
                    {selectedImage?.name} ({((selectedImage?.size ?? 0) / 1024).toFixed(1)} KB)
                    </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="body">Содержание поста</Label>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Input
                    type="file"
                    accept="image/*"
                    id="inline-image"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleInlineImageUpload}
                    disabled={isUploading}
                  />
                  <Button 
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ImagePlus className="h-4 w-4" />
                    )}
                    {isUploading ? "Загрузка..." : "Вставить изображение"}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <Textarea
                ref={textareaRef}
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyUp={saveCursorPosition}
                onClick={saveCursorPosition}
                placeholder="Введите содержание поста. Вы можете добавлять изображения с помощью кнопки выше."
                rows={8}
                required
                className="font-mono text-sm"
              />
              {isUploading && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-sm mt-2">Загрузка изображения...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label>Категории</Label>
            <MultiSelect 
              options={categories}
              selected={selectedCategories}
              onChange={setSelectedCategories}
              placeholder="Выберите категории..."
            />
          </div>
          
          <div className="grid gap-2">
            <Label>Теги</Label>
            <MultiSelect 
              options={tags}
              selected={selectedTags}
              onChange={setSelectedTags}
              placeholder="Выберите теги..."
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="mr-2"
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Публикация..." : "Опубликовать пост"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}