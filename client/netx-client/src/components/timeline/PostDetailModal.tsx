"use client";

import React from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

// Определим тип Post более полно, если у вас есть эти данные
// Если нет, некоторые поля будут опциональными
type Post = {
  id: string;
  title: string;
  content: string; // Предполагаем, что это полный текст поста (body)
  createdAt: string;
  imageUrl?: string;
  tags?: string[]; // Или массив объектов { id: string, name: string }
  categories?: string[]; // Или массив объектов { id: string, name: string }
  creator?: { // Если есть информация об авторе
    username: string;
  };
};

interface PostDetailModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PostDetailModal({ post, isOpen, onClose }: PostDetailModalProps) {
  if (!post) {
    return null;
  }

  const formattedDate = React.useMemo(() => {
    try {
      const date = parseISO(post.createdAt);
      return format(date, "d MMMM yyyy 'в' HH:mm", { locale: ru });
    } catch (e) {
      return "Дата недоступна";
    }
  }, [post.createdAt]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] flex flex-col">
        <DialogHeader className="pt-4 pr-12"> {/* Добавим отступ справа для кнопки закрытия */}
          <DialogTitle className="text-2xl font-bold mb-2">{post.title}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Опубликовано: {formattedDate}
            {post.creator && ` | Автор: ${post.creator.username}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto pr-4 space-y-4 py-4"> {/* Добавим отступ для скроллбара */}
          {post.imageUrl && (
            <div className="relative w-full h-64 md:h-80 rounded-md overflow-hidden my-4">
              <Image
                src={post.imageUrl}
                alt={`Изображение к посту ${post.title}`}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
          {/* Используем dangerouslySetInnerHTML если content содержит HTML или nl2br для переносов строк */}
          {/* Для простого текста: */}
          <div
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }}
          />


          {post.categories && post.categories.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-1">Категории:</h4>
              <div className="flex flex-wrap gap-2">
                {post.categories.map((category, index) => (
                  <Badge key={`cat-${index}`} variant="outline">
                    {typeof category === 'string' ? category : category} {/* Предполагаем, что category это строка */}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {post.tags && post.tags.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-1">Теги:</h4>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, index) => (
                  <Badge key={`tag-${index}`} variant="secondary">
                    #{typeof tag === 'string' ? tag : tag} {/* Предполагаем, что tag это строка */}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-end pt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Закрыть
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}