"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit3, Trash2, MoreVertical } from 'lucide-react';
import { useAuth } from '@/components/ui/AuthProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Post = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  imageUrl?: string;
  tags?: string[];
  categories?: string[];
  creator?: {
    id: string;
    username: string;
  };
};

type TimelineCardProps = {
  post: Post;
  onClick: (post: Post) => void;
  onEditRequest: (post: Post) => void;
  onDeleteRequest: (postId: string) => void;
};

export function TimelineCard({ post, onClick, onEditRequest, onDeleteRequest }: TimelineCardProps) {
  const { user, isAdmin } = useAuth();
  const canModify = isAdmin || (user && user.id === post.creator?.id);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    onEditRequest(post);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    onDeleteRequest(post.id);
  };

  return (
    <div className="group relative"> {/* Added relative for positioning actions */}
      <Card
        onClick={() => onClick(post)}
        className="w-full max-w-[45rem] min-h-[15rem] shadow-none hover:shadow-none group-hover:bg-primary/5 group-hover:shadow-lg transition-all duration-200 rounded-xl overflow-hidden p-0 cursor-pointer"
      >
        {post.imageUrl && (
          <div className="w-full h-48 md:h-56 relative block"> {/* Increased height */}
            <Image
              src={post.imageUrl}
              alt={`Изображение к ${post.title}`}
              fill
              className="object-cover"
              priority={false} // Usually only one priority image per page
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        
        <div className="w-full px-6 py-4">
          <div className="mb-3">
            <h3 className="text-xl lg:text-2xl font-semibold group-hover:text-primary transition-colors duration-200 line-clamp-2">
              {post.title}
            </h3>
          </div>
          
          <div className="py-2 font-normal text-gray-500 dark:text-gray-400">
            <p className="line-clamp-3">
              {post.content}
            </p>
          </div>
          
          {post.tags && post.tags.length > 0 && (
            <div className="pt-3 flex flex-wrap gap-2 border-t mt-3">
              {post.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
              {post.tags.length > 3 && <Badge variant="outline" className="text-xs">...</Badge>}
            </div>
          )}
        </div>
      </Card>

      {canModify && (
        <div className="absolute top-2 right-2 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background/50 hover:bg-background/80">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit3 className="mr-2 h-4 w-4" />
                Редактировать
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                <Trash2 className="mr-2 h-4 w-4" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}