"use client";

import { useState, useEffect, useCallback } from 'react';
import { TimelineContainer } from '@/components/timeline';
import { Header } from "@/modules/widgets/header/header";
import { CreatePostDialog } from "@/modules/widgets/posts/create-post-dialog";
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import { useAuth } from '@/components/ui/AuthProvider';
import { toast } from 'sonner';

type ClientPost = {
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
  description?: string;
  status?: string;
  rawCategories?: { id: string; name: string }[];
  rawTags?: { id: string; name: string }[];
};

type ServerPost = {
  id: string;
  title: string;
  description?: string;
  body: string;
  preview_url?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  creator_user_id: string;
  creator?: {
    id: string;
    username: string;
  };
  categories?: { id: string; name: string }[];
  tags?: { id: string; name: string }[];
};

type ServerResponse = {
  content?: {
    posts: ServerPost[];
    total: number;
  };
  error?: any;
};

interface EditablePostForDialog {
  id: string;
  title: string;
  description?: string;
  body: string;
  status?: string;
  categories?: { id: string; name: string }[] | string[];
  tags?: { id: string; name: string }[] | string[];
  preview_url?: string;
}

const API_BASE_URL_PUBLIC = "http://localhost:3001/api/v1";
const API_BASE_URL_PRIVATE = "http://localhost:3001/api/v1/private";
const SERVER_ASSET_HOST = "http://localhost:3001";

export default function Home() {
  const [posts, setPosts] = useState<ClientPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [editingPostDialogData, setEditingPostDialogData] = useState<EditablePostForDialog | null>(null);
  const { isAdmin, isAuthenticated, user } = useAuth();

  const fetchPosts = useCallback(async () => {
    setIsLoadingPosts(true);
    try {
      const response = await fetch(`${API_BASE_URL_PUBLIC}/posts`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Error fetching posts: ${response.status} ${response.statusText}`, errorData);
        throw new Error(`Ошибка загрузки постов: ${response.status}`);
      }
      const data: ServerResponse = await response.json();
      if (data.error || !data.content?.posts) {
        console.error("Error in server response data:", data.error || "No posts found in content");
        throw new Error(data.error?.message || "Посты не найдены или ошибка в данных ответа");
      }

      const clientPostsResult: ClientPost[] = data.content.posts.map(serverPost => {
        let imageUrl = undefined;
        if (serverPost.preview_url) {
          if (serverPost.preview_url.startsWith('http://') || serverPost.preview_url.startsWith('https://')) {
            imageUrl = serverPost.preview_url;
          } else {
            const path = serverPost.preview_url.startsWith('/') ? serverPost.preview_url : `/${serverPost.preview_url}`;
            imageUrl = `${SERVER_ASSET_HOST}${path}`;
          }
        }
        return {
          id: serverPost.id,
          title: serverPost.title,
          description: serverPost.description,
          content: serverPost.body,
          createdAt: serverPost.createdAt,
          status: serverPost.status,
          imageUrl: imageUrl,
          tags: serverPost.tags?.map(tag => tag.name),
          categories: serverPost.categories?.map(category => category.name),
          creator: serverPost.creator ? { id: serverPost.creator.id, username: serverPost.creator.username } : undefined,
          rawCategories: serverPost.categories,
          rawTags: serverPost.tags,
        };
      });
      setPosts(clientPostsResult);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      setPosts([]);
    } finally {
      setIsLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleOpenCreateDialog = () => {
    if (!isAuthenticated || !isAdmin) {
        toast.error("Доступ запрещен", { description: "Только администраторы могут создавать посты." });
        return;
    }
    setEditingPostDialogData(null);
    setIsPostDialogOpen(true);
  };

  const handleOpenEditDialog = (postToEdit: ClientPost) => {
    if (!isAuthenticated || (!isAdmin && user?.id !== postToEdit.creator?.id)) {
        toast.error("Доступ запрещен", { description: "Вы можете редактировать только свои посты." });
        return;
    }
    const dialogData: EditablePostForDialog = {
        id: postToEdit.id,
        title: postToEdit.title,
        description: postToEdit.description,
        body: postToEdit.content,
        status: postToEdit.status,
        categories: postToEdit.rawCategories,
        tags: postToEdit.rawTags,
        preview_url: postToEdit.imageUrl,
    };
    setEditingPostDialogData(dialogData);
    setIsPostDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    setIsPostDialogOpen(false);
    setEditingPostDialogData(null);
    fetchPosts();
  };

  const handleDeletePost = async (postId: string) => {
    const postToDelete = posts.find(p => p.id === postId);

    if (!isAuthenticated || !isAdmin) {
        toast.error("Доступ запрещен", { description: "Только администраторы могут удалять посты." });
        return;
    }

    if (!window.confirm("Вы уверены, что хотите удалить этот пост?")) return;

    try {
      const response = await fetch(`${API_BASE_URL_PRIVATE}/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Не удалось удалить пост. Статус: ${response.status}`);
      }
      toast.success("Пост удален");
      fetchPosts();
    } catch (error) {
      console.error("Ошибка удаления поста:", error);
      toast.error("Ошибка удаления поста", { description: (error as Error).message });
    }
  };

  return (
    <>
      <Header />
      <main>
        {isAuthenticated && isAdmin && (
          <div className="container mx-auto px-4 pt-6 text-right">
            <Button onClick={handleOpenCreateDialog} className="shadow-none flex items-center gap-1 ml-auto">
              <PlusIcon size={16} />
              Создать пост
            </Button>
          </div>
        )}
        {isLoadingPosts ? (
          <div className="container mx-auto px-4 py-12 text-center">
            <p className="text-lg text-muted-foreground">Загрузка постов...</p>
          </div>
        ) : posts.length > 0 ? (
          <TimelineContainer
            posts={posts}
            onEditRequest={handleOpenEditDialog}
            onDeleteRequest={handleDeletePost}
          />
        ) : (
          <div className="container mx-auto px-4 py-12 text-center">
            <p className="text-lg text-muted-foreground">Не удалось загрузить посты или посты отсутствуют.</p>
          </div>
        )}
      </main>

      {isPostDialogOpen && (
        <CreatePostDialog
          open={isPostDialogOpen}
          onOpenChange={setIsPostDialogOpen}
          onSuccess={handleDialogSuccess}
          postToEdit={editingPostDialogData}
        />
      )}
    </>
  );
}