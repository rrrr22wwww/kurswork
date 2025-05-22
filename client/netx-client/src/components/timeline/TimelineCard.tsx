"use client";

import React from 'react';
import { Card } from '@/components/ui/card'; // Убрали неиспользуемые Card компоненты
import { format, parseISO } from 'date-fns/locale'; // Убрали ru, так как оно не используется напрямую здесь
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

type Post = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  imageUrl?: string;
  tags?: string[];
  // Добавьте другие поля, если они есть, например, categories, creator
  categories?: string[];
   creator?: {
    username: string;
  };
};

type TimelineCardProps = {
  post: Post;
  onClick: (post: Post) => void; // Добавляем пропс для клика
};

export function TimelineCard({ post, onClick }: TimelineCardProps) {

  return (
    <div onClick={() => onClick(post)} className="cursor-pointer group"> {/* Обертка для клика и hover-эффекта */}
      <Card className="w-full max-w-[45rem] max-h-[31.25rem] shadow-none hover:shadow-none group-hover:bg-primary/5 group-hover:shadow-lg transition-all duration-200 rounded-xl overflow-hidden p-0">
        {post.imageUrl && (
          <div className="w-full h-32 relative block">
        <Image 
          src={post.imageUrl}
          alt={`Изображение к ${post.title}`}
          fill
          className="object-cover"
          priority
        />
          </div>
        )}
        
        <div className="w-full px-6 py-4">
          <div className="mb-3">
        <h3 className="text-2xl lg:text-3xl font-semibold group-hover:text-primary transition-colors duration-200 line-clamp-2"> {/* Уменьшил размер заголовка для лучшего вида */}
          {post.title}
        </h3>
          </div>
          
          <div className="py-2 font-normal text-gray-500 dark:text-gray-400">
        {/* Отображаем только часть контента или описание, если оно есть */}
        <p className="line-clamp-3"> 
          {post.content}
        </p>
          </div>
          
          {post.tags && post.tags.length > 0 && (
        <div className="pt-3 flex flex-wrap gap-2 border-t mt-3">
          {post.tags.slice(0, 3).map(tag => ( // Показываем не более 3 тегов для краткости
            <Badge key={tag} variant="outline" className="text-xs">
          #{tag}
            </Badge>
          ))}
          {post.tags.length > 3 && <Badge variant="outline" className="text-xs">...</Badge>}
        </div>
          )}
        </div>
      </Card>
    </div>
  );
}