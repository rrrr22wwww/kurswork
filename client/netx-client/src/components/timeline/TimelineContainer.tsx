"use client";

import React, { useRef, useState, useEffect } from 'react';
import { TimelineCard } from './TimelineCard';
import { PostDetailModal } from './PostDetailModal'; // Импортируем модальное окно
import { format, parseISO } from 'date-fns';

// Убедимся, что тип Post здесь соответствует ожиданиям PostDetailModal и TimelineCard
type Post = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  imageUrl?: string;
  tags?: string[];
  categories?: string[]; // Добавим категории, если они есть
   creator?: { // Добавим автора, если он есть
    username: string;
  };
};

type TimelineProps = {
  posts: Post[];
};

export function TimelineContainer({ posts }: TimelineProps) {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [dotPositions, setDotPositions] = useState<number[]>([]);

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = (post: Post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Можно добавить задержку перед сбросом selectedPost, чтобы избежать "мелькания" контента при закрытии
    setTimeout(() => setSelectedPost(null), 300); 
  };
  
  useEffect(() => {
    const calculateDotPositions = () => {
      const positions = cardRefs.current
        .filter(ref => ref !== null)
        .map(ref => {
          const top = ref!.offsetTop;
          const height = ref!.offsetHeight;
          // className="mb-16 -relative" - 64px высчитываем по этому значению
          return (top + height) - 64*2 ; 
        });
      
      setDotPositions(positions);
    };
    
    const timer = setTimeout(() => {
      calculateDotPositions();
    }, 100);
    
    window.addEventListener('resize', calculateDotPositions);
    
    const observers = cardRefs.current.map((ref) => {
      if (!ref) return null;
      
      const observer = new MutationObserver(() => {
        calculateDotPositions();
      });
      
      observer.observe(ref, { 
        childList: true, 
        subtree: true,
        attributes: true,
        characterData: true 
      });
      
      return observer;
    });
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateDotPositions);
      observers.forEach(obs => obs?.disconnect());
    };
  }, [posts.length]);

  const formatDateTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      const formattedDate = format(date, "dd/MM");
      const formattedTime = format(date, "yyyy/HH:mm");
      
      return { date: formattedDate, time: formattedTime };
    } catch (e) {
      console.error("Ошибка парсинга даты:", e);
      return { date: "Недоступно", time: "--:--" };
    }
  };
  
  return (
    <>
      <div className="container mx-auto px-4 py-12 md:px-32"> 
        <div className="flex">
          <div className="relative w-24 flex-shrink-0 hidden md:block"> 
            <div className="absolute h-full w-[2px] bg-gray-200 dark:bg-gray-700 left-1/2 -translate-x-1/2">
              <div
                className="absolute left-1/2 -translate-x-1/2"
                style={{ top: '0px' }}
              >
                <div
                  className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full -translate-y-1/2 z-10"
                />
              </div>

              {posts.map((post, index) => {
                const topPosition = dotPositions[index] || (index * 200 + 70); // Базовое позиционирование
                const { date, time } = formatDateTime(post.createdAt);
                
                return (
                  <div
                    key={`${post.id}-dot`}
                    className="absolute left-1/2 -translate-x-1/2" // Центрируем точку
                    style={{ top: `${topPosition}px` }}
                  >
                    <div className="absolute right-6 -translate-y-1/2 text-right whitespace-nowrap">
                      <div className="text-3xl md:text-4xl font-normal text-gray-400 dark:text-gray-500">{date}</div>
                      <div className="text-base md:text-lg text-gray-400 dark:text-gray-500">{time}</div>
                    </div>
                    <div
                      className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full -translate-y-1/2 z-10"
                    />
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="flex-grow md:pl-8 max-w-[40rem]"> {/* Добавляем отступ слева на средних и больших экранах */}
            {posts.map((post, index) => (
              <div 
                key={post.id} 
                className="mb-16 relative"
                // @ts-ignore
                ref={el => { cardRefs.current[index] = el; }}
              >
                <TimelineCard post={post} onClick={handleCardClick} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <PostDetailModal
        post={selectedPost}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}