"use client";

import { useState, useEffect, useRef, DragEvent } from "react"; 
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PlusIcon, X, UploadCloud } from "lucide-react";
import { MultiSelect, OptionType } from "@/components/ui/multi-select";

const API_BASE_URL = "http://localhost:3001/api/v1/private";

interface CreatePostDialogProps {
  onPostCreated?: () => void;
}

export function CreatePostDialog({ onPostCreated }: CreatePostDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const status = "draft";
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false); // Состояние для отслеживания перетаскивания

  const [availableCategories, setAvailableCategories] = useState<OptionType[]>([]);
  const [availableTags, setAvailableTags] = useState<OptionType[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!open) return; // Загружаем данные только если диалог открыт
      try {
        const catResponse = await fetch(`${API_BASE_URL}/categories`, { credentials: 'include' });
        const tagResponse = await fetch(`${API_BASE_URL}/tags`, { credentials: 'include' });

        if (catResponse.ok) {
          const catData = await catResponse.json();
          const categoriesFromServer = Array.isArray(catData.content?.categories) ? catData.content.categories : [];
          setAvailableCategories(categoriesFromServer);
        } else {
          console.error("Failed to fetch categories");
          setAvailableCategories([]);
          toast.error("Ошибка", { description: "Не удалось загрузить категории" });
        }

        if (tagResponse.ok) {
          const tagData = await tagResponse.json();
          const tagsFromServer = Array.isArray(tagData.content?.tags) ? tagData.content.tags : [];
          setAvailableTags(tagsFromServer);
        } else {
          console.error("Failed to fetch tags");
          setAvailableTags([]);
          toast.error("Ошибка", { description: "Не удалось загрузить теги" });
        }
      } catch (error) {
        console.error("Error fetching categories/tags:", error);
        toast.error("Ошибка сети", { description: "Не удалось подключиться к серверу для загрузки данных." });
      }
    };

    fetchData();
  }, [open]);

  const processFile = (file: File | null) => {
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file);
      const objectUrl = URL.createObjectURL(file);
      setImagePreviewUrl(objectUrl);
    } else if (file) { // Если файл выбран, но это не изображение
      toast.error("Неверный тип файла", { description: "Пожалуйста, выберите изображение (PNG, JPG, GIF)." });
      clearSelectedImage(); // Очищаем, если файл невалидный
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFile(e.target.files && e.target.files[0]);
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    // Очистка URL объекта при размонтировании или закрытии диалога, если есть превью
    if (!open && imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null); // Сбрасываем URL превью
      setSelectedImage(null); // Сбрасываем выбранный файл
    }
  }, [open, imagePreviewUrl]);


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
      // Очищаем DataTransfer, чтобы избежать проблем с последующими drop событиями
      if (e.dataTransfer.items) {
        e.dataTransfer.items.clear();
      } else {
        e.dataTransfer.clearData();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("body", body);
      formData.append("status", status);

      selectedCategories.forEach(categoryId => formData.append("categories[]", categoryId));
      selectedTags.forEach(tagId => formData.append("tags[]", tagId));

      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      // Логирование содержимого FormData для проверки
      console.log("Отправляемые данные (FormData):");
      for (let pair of formData.entries()) {
        // Если значение является файлом, выводим его имя и тип, иначе само значение
        if (pair[1] instanceof File) {
          console.log(`${pair[0]}: File name: ${pair[1].name}, File type: ${pair[1].type}, File size: ${pair[1].size}`);
        } else {
          console.log(`${pair[0]}: ${pair[1]}`);
        }
      }

      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        body: formData, // Отправка FormData. Content-Type 'multipart/form-data' устанавливается браузером автоматически.
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: { message: "Не удалось разобрать ошибку сервера. Статус: " + response.status } 
        }));
        console.error("Server error data:", errorData); // Эта строка у вас уже есть
        // Попытка получить более детальное сообщение об ошибке
        let detailedErrorMessage = "Ошибка сервера при создании поста";
        if (errorData && errorData.error) {
            if (typeof errorData.error === 'string') {
                detailedErrorMessage = errorData.error;
            } else if (errorData.error.message) {
                detailedErrorMessage = errorData.error.message;
            } else if (Object.keys(errorData.error).length > 0) {
                // Если есть объект ошибки, но нет message, можно попробовать его сериализовать
                try {
                    detailedErrorMessage = JSON.stringify(errorData.error);
                } catch (e) {
                    // ignore
                }
            }
        }
        throw new Error(detailedErrorMessage);
      }

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

    } catch (error: any) {
      console.error("Ошибка при создании поста:", error);
      toast.error("Ошибка создания поста", {
        description: error.message || "Произошла неизвестная ошибка"
      });
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
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 max-h-[80vh] overflow-y-auto px-2">
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
            <Label htmlFor="description">Краткое описание (необязательно)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Введите краткое описание поста"
              rows={2}
            />
          </div>
          
          {/* Блок загрузки изображения с drag-and-drop */}
          <div className="grid gap-2">
            <Label htmlFor="image-upload-dnd">Изображение для превью (необязательно)</Label>
            {!imagePreviewUrl ? (
              <div
                id="image-upload-dnd"
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer
                            bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 
                            dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600
                            transition-colors duration-200 ease-in-out
                            ${isDragging ? 'border-primary dark:border-primary' : 'border-gray-300'}`}
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
                  id="image-upload-input" // ID для скрытого инпута
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
            <Label htmlFor="body">Содержание поста</Label>
            <div className="relative">
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Введите содержание поста."
                rows={8}
                required
                className="font-mono text-sm shadow-none"
              />
            </div>
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
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="mr-2 shadow-none"
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting} className="shadow-none">
              {isSubmitting ? "Публикация..." : "Опубликовать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}