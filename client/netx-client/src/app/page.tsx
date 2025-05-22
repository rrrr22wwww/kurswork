import { TimelineContainer } from '@/components/timeline';
import { Header } from "@/modules/widgets/header/header";

// Define the Post type expected by client components
type ClientPost = {
  id: string;
  title: string;
  content: string; // Mapped from server's 'body'
  createdAt: string;
  imageUrl?: string; // Mapped from server's 'preview_url'
  tags?: string[]; // Mapped from server's array of tag objects
  categories?: string[]; // Mapped from server's array of category objects
  creator?: {
    username: string;
  };
};

// Define the structure of a single post object coming from the server
type ServerPost = {
  id: string;
  title: string;
  description?: string; // Optional, based on your model
  body: string;
  preview_url?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  creator_user_id: string;
  creator?: { // Included by your facade
    id: string;
    username: string;
  };
  categories?: { // Included by your facade
    id: string;
    name: string;
  }[];
  tags?: { // Included by your facade
    id: string;
    name: string;
  }[];
};

// Define the structure of the server's response for posts
type ServerResponse = {
  content?: {
    posts: ServerPost[];
    total: number;
    // Potentially other pagination fields if your API returns them
  };
  error?: any; // Or a more specific error type
};

const API_BASE_URL = "http://localhost:3001/api/v1";
const SERVER_ASSET_HOST = "http://localhost:3001"; // Базовый URL для статических файлов сервера

async function getPostsFromServer(): Promise<ClientPost[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Error fetching posts: ${response.status} ${response.statusText}`, errorData);
      return [];
    }

    const data: ServerResponse = await response.json();

    if (data.error || !data.content?.posts) {
      console.error("Error in server response data:", data.error || "No posts found in content");
      return [];
    }

    const clientPosts: ClientPost[] = data.content.posts.map(post => {
      let imageUrl = undefined;
      if (post.preview_url) {
        // Проверяем, не является ли preview_url уже полным URL
        if (post.preview_url.startsWith('http://') || post.preview_url.startsWith('https://')) {
          imageUrl = post.preview_url;
        } else {
          // Если это относительный путь, добавляем хост сервера
          // Убедимся, что между хостом и путем есть только один слеш
          const path = post.preview_url.startsWith('/') ? post.preview_url : `/${post.preview_url}`;
          imageUrl = `${SERVER_ASSET_HOST}${path}`;
        }
      }

      return {
        id: post.id,
        title: post.title,
        content: post.body,
        createdAt: post.createdAt,
        imageUrl: imageUrl, // Используем сформированный URL
        tags: post.tags?.map(tag => tag.name),
        categories: post.categories?.map(category => category.name),
        creator: post.creator ? { username: post.creator.username } : undefined,
      };
    });

    return clientPosts;

  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return [];
  }
}

export default async function Home() {
  const posts = await getPostsFromServer();

  return (
    <>
      <Header />
      <main>
        {posts.length > 0 ? (
          <TimelineContainer posts={posts} />
        ) : (
          <div className="container mx-auto px-4 py-12 text-center">
            <p className="text-lg text-muted-foreground">Не удалось загрузить посты или посты отсутствуют.</p>
          </div>
        )}
      </main>
    </>
  );
}