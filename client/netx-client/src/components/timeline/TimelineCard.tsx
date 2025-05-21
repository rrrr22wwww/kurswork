"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

type Post = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  imageUrl?: string;
  tags?: string[];
};

type TimelineCardProps = {
  post: Post;
};

export function TimelineCard({ post }: TimelineCardProps) {
  const formattedDate = React.useMemo(() => {
    try {
      const date = parseISO(post.createdAt);
      return format(date, "d MMMM yyyy", { locale: ru });
    } catch (e) {
      return "Недоступно";
    }
  }, [post.createdAt]);

  return (
    <Card className="w-full max-w-[45rem] max-h-[31.25rem] shadow-none rounded-xl overflow-hidden p-0">
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
      
      {/* Контент с явными отступами */}
      <div className="w-full px-6 py-4">
        {/* Заголовок без стандартного компонента CardHeader */}
        <div className="mb-3">
          <h3 className="text-4xl font-semibold">{post.title}</h3>
        </div>
        
        {/* Содержимое */}
        <div className="py-2 font-normal text-gray-500">
          <p>{post.content}</p>
        </div>
        
        {/* Теги */}
        {post.tags && post.tags.length > 0 && (
          <div className="pt-3 flex flex-wrap gap-2 border-t mt-3">
            {post.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}