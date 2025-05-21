import { TimelineContainer } from '@/components/timeline';
import { Header } from "@/modules/widgets/header/header";

// Тестовые данные с изображениями и тегами
const samplePosts = [
  {
    id: '1',
    title: 'Ученые открыли новый способ видеть sssssssssssssss',
    content: 'Содержание первой новости на таймлайне с подробным описанием произошедших событий.',
    createdAt: '2025-05-20T14:30:00Z',
    imageUrl: '/images/20200125110231_Priroda_10-344.jpg', // относительный путь от public
    tags: ['новость', 'технологии', 'наука']
  },
  {
    id: '2',
    title: 'Вторая новость',
    content: 'Содержание второй новости на таймлайне.',
    createdAt: '2025-05-19T09:15:00Z',
    tags: ['событие', 'общество']
  },
  {
    id: '3',
    title: 'Третья новость',
    content: 'Содержание третьей новости на таймлайне. Содержание третьей новости на таймлайне.',
    createdAt: '2025-05-18T16:45:00Z',
    imageUrl: '/images/20200125110231_Priroda_10-344.jpg'
  }
];

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <TimelineContainer posts={samplePosts} />
      </main>
    </>
  );
}